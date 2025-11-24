import { Binary } from 'cafe-utility'
import { decryptEncryptedChunk, extractChunkAddress, extractEncryptionKey } from '../chunk/encrypted-cac'
import type { Bee } from '../bee'
import type { BeeRequestOptions, DownloadOptions } from '../types'
import { Reference, Span } from './typed-bytes'
import { MAX_PAYLOAD_SIZE } from '../chunk/cac'
import { NULL_ADDRESS } from './constants'

/**
 * Progress information for download operations
 */
export interface DownloadProgress {
  /**
   * Total number of chunks to download
   */
  total: number

  /**
   * Number of chunks already processed
   */
  processed: number
}

/**
 * Options for the ChunkJoiner
 */
export interface ChunkJoinerOptions {
  /**
   * Callback for download progress updates
   */
  onDownloadProgress?: (progress: DownloadProgress) => void

  /**
   * Download options to pass to bee.downloadChunk
   */
  downloadOptions?: DownloadOptions

  /**
   * Request options for HTTP calls
   */
  requestOptions?: BeeRequestOptions

  /**
   * Maximum number of concurrent chunk downloads
   */
  concurrency?: number
}

/**
 * ChunkJoiner reconstructs files from Swarm's Merkle tree chunk structure.
 *
 * It handles:
 * - Transparent encryption/decryption for 64-byte encrypted references
 * - Parallel chunk fetching with configurable concurrency
 * - Progress tracking
 * - Streaming via ReadableStream API
 *
 * The Swarm file structure is a Merkle tree where:
 * - Root chunk contains: [8-byte span] + [references to children]
 * - Intermediate chunks contain more references
 * - Leaf chunks contain actual file data
 * - References are 32 bytes (plain) or 64 bytes (encrypted: 32 addr + 32 key)
 */
export class ChunkJoiner {
  private bee: Bee
  private rootReference: Reference
  private rootEncryptionKey?: Uint8Array
  private isEncrypted: boolean
  private options: ChunkJoinerOptions
  private fileSize?: bigint
  private totalChunks: number = 0
  private processedChunks: number = 0

  constructor(bee: Bee, reference: Reference | Uint8Array | string, options: ChunkJoinerOptions = {}) {
    this.bee = bee
    this.rootReference = new Reference(reference)
    this.options = options

    // Detect encryption: 64-byte references are encrypted
    this.isEncrypted = this.rootReference.length === 64
    if (this.isEncrypted) {
      this.rootEncryptionKey = extractEncryptionKey(this.rootReference)
      this.rootReference = extractChunkAddress(this.rootReference)
    }
  }

  /**
   * Gets the file size (must call after initialization or first read)
   */
  async getSize(): Promise<bigint> {
    if (this.fileSize !== undefined) {
      return this.fileSize
    }

    // Fetch root chunk to get span
    await this.fetchAndParseRoot()

    return this.fileSize!
  }

  /**
   * Fetches and parses the root chunk to extract file size and calculate total chunks
   */
  private async fetchAndParseRoot(): Promise<void> {
    if (this.fileSize !== undefined) {
      return
    }

    const rootChunkData = await this.downloadChunk(this.rootReference, this.rootEncryptionKey)
    const span = Span.fromSlice(rootChunkData, 0)
    this.fileSize = span.toBigInt()

    // Calculate total chunks including intermediate chunks
    // For a balanced binary tree with N data chunks, we have approximately N-1 intermediate chunks
    // So total chunks ≈ 2N - 1
    const dataChunks = Math.ceil(Number(this.fileSize) / MAX_PAYLOAD_SIZE)

    // Estimate intermediate chunks in the tree
    // For simplicity, we'll count all chunks we actually process
    // Set initial estimate and update as we go
    this.totalChunks = dataChunks
    this.updateProgress()
  }

  /**
   * Downloads a chunk and optionally decrypts it
   */
  private async downloadChunk(reference: Reference, encryptionKey?: Uint8Array): Promise<Uint8Array> {
    try {
      const chunkData = await this.bee.downloadChunk(
        reference,
        this.options.downloadOptions,
        this.options.requestOptions,
      )

      // Decrypt if we have an encryption key
      if (encryptionKey) {
        return decryptEncryptedChunk(chunkData, encryptionKey)
      }

      return chunkData
    } catch (error) {
      // Provide more helpful error message
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status === 404 || status === 500) {
          throw new Error(
            `Failed to download chunk ${reference.toHex()}: Chunk not found. ` +
              `Make sure the data exists on the Bee node.`,
          )
        }
      }
      throw error
    }
  }

  /**
   * Updates and reports progress
   */
  private updateProgress(): void {
    if (this.options.onDownloadProgress) {
      this.options.onDownloadProgress({
        total: this.totalChunks,
        processed: this.processedChunks,
      })
    }
  }

  /**
   * Recursively reads data from a chunk reference
   *
   * @param reference The chunk reference (32 or 64 bytes)
   * @param encryptionKey Optional encryption key for this chunk
   * @returns The data payload
   */
  private async readChunkRecursively(reference: Reference, encryptionKey?: Uint8Array): Promise<Uint8Array> {
    const chunkData = await this.downloadChunk(reference, encryptionKey)

    // Extract span from the chunk
    const span = Span.fromSlice(chunkData, 0)
    const spanValue = span.toBigInt()
    const payload = chunkData.slice(Span.LENGTH)

    // If span is <= MAX_PAYLOAD_SIZE, this is a leaf chunk with actual data
    if (spanValue <= BigInt(MAX_PAYLOAD_SIZE)) {
      this.processedChunks++
      this.updateProgress()
      return payload.slice(0, Number(spanValue))
    }

    // This is an intermediate chunk containing references
    // Each reference is either 32 bytes (plain) or 64 bytes (encrypted)
    // If the file is encrypted, all references in the tree are 64 bytes
    const referenceSize = this.isEncrypted ? 64 : 32
    const childReferences: Array<{ ref: Reference; key?: Uint8Array }> = []

    for (let offset = 0; offset < payload.length; offset += referenceSize) {
      const refBytes = payload.slice(offset, offset + referenceSize)
      if (refBytes.length < referenceSize) {
        break // End of references
      }

      // Extract the address (first 32 bytes)
      const addressBytes = refBytes.slice(0, 32)

      // Skip NULL_ADDRESS (all zeros) - these are padding in the tree structure
      if (Binary.equals(addressBytes, NULL_ADDRESS)) {
        continue
      }

      if (this.isEncrypted) {
        // Encrypted reference: split into address and key
        childReferences.push({
          ref: new Reference(addressBytes),
          key: refBytes.slice(32, 64),
        })
      } else {
        childReferences.push({
          ref: new Reference(addressBytes),
        })
      }
    }

    // Fetch all child chunks with concurrency control
    // Process in batches to avoid exceeding queue capacity
    const concurrency = this.options.concurrency ?? 64
    const childDataArray: Uint8Array[] = new Array(childReferences.length)

    // Process chunks in batches
    for (let i = 0; i < childReferences.length; i += concurrency) {
      const batch = childReferences.slice(i, Math.min(i + concurrency, childReferences.length))
      const batchPromises = batch.map(async ({ ref, key }, batchIndex) => {
        const actualIndex = i + batchIndex
        const data = await this.readChunkRecursively(ref, key)
        childDataArray[actualIndex] = data
      })

      await Promise.all(batchPromises)
    }

    // Concatenate all child data (already in correct order)
    return Binary.concatBytes(...childDataArray)
  }

  /**
   * Creates a ReadableStream that streams the file data
   */
  async createReadableStream(): Promise<ReadableStream<Uint8Array>> {
    // Fetch root to get file size
    await this.fetchAndParseRoot()

    const self = this
    let started = false

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          started = true

          // Read the entire file recursively
          // Note: For very large files, we might want to implement chunked streaming
          // but for now, we'll read the whole tree and stream it out
          const fileData = await self.readChunkRecursively(self.rootReference, self.rootEncryptionKey)

          // Enqueue the data
          controller.enqueue(fileData)
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },

      cancel() {
        // Clean up if needed
      },
    })
  }

  /**
   * Reads the entire file into memory
   *
   * This is a convenience method for when streaming is not needed.
   */
  async readAll(): Promise<Uint8Array> {
    await this.fetchAndParseRoot()
    return this.readChunkRecursively(this.rootReference, this.rootEncryptionKey)
  }
}

/**
 * Helper function to create a ReadableStream for downloading a file by reference
 *
 * @param bee Bee instance
 * @param reference File reference (32 or 64 bytes)
 * @param options Options including progress callback
 * @returns ReadableStream of file data
 */
export async function createDownloadStream(
  bee: Bee,
  reference: Reference | Uint8Array | string,
  options?: ChunkJoinerOptions,
): Promise<ReadableStream<Uint8Array>> {
  const joiner = new ChunkJoiner(bee, reference, options)
  return joiner.createReadableStream()
}
