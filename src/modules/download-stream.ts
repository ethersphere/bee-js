import type { Bee } from '../bee'
import type { BeeRequestOptions, DownloadOptions, FileData } from '../types'
import { MantarayNode } from '../manifest/manifest'
import { Reference } from '../utils/typed-bytes'
import { ChunkJoiner, type ChunkJoinerOptions, type DownloadProgress } from '../utils/chunk-joiner'

/**
 * Options for streaming download operations
 */
export interface DownloadStreamOptions extends DownloadOptions {
  /**
   * Callback for download progress updates
   */
  onDownloadProgress?: (progress: DownloadProgress) => void

  /**
   * Maximum number of concurrent chunk downloads
   */
  concurrency?: number
}

/**
 * Downloads data as a streaming ReadableStream by fetching chunks in parallel
 *
 * This function:
 * 1. Detects if reference is encrypted (64 bytes) or plain (32 bytes)
 * 2. Fetches the root chunk to determine file size
 * 3. Recursively fetches all chunks in parallel
 * 4. Handles decryption transparently if needed
 * 5. Returns a ReadableStream for efficient memory usage
 *
 * @param bee Bee instance
 * @param resource Swarm reference (32 or 64 bytes for encrypted content)
 * @param options Options including progress callback and concurrency
 * @param requestOptions Request options for HTTP calls
 * @returns ReadableStream of file data
 *
 * @example
 * ```typescript
 * const stream = await downloadDataStreaming(bee, reference, {
 *   onDownloadProgress: ({ total, processed }) => {
 *     console.log(`Downloaded ${processed}/${total} chunks`)
 *   }
 * })
 *
 * // Use the stream
 * const reader = stream.getReader()
 * while (true) {
 *   const { done, value } = await reader.read()
 *   if (done) break
 *   // Process value (Uint8Array)
 * }
 * ```
 */
export async function downloadDataStreaming(
  bee: Bee,
  resource: Reference | Uint8Array | string,
  options?: DownloadStreamOptions,
  requestOptions?: BeeRequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const reference = new Reference(resource)

  const joinerOptions: ChunkJoinerOptions = {
    onDownloadProgress: options?.onDownloadProgress,
    downloadOptions: options,
    requestOptions,
    concurrency: options?.concurrency,
  }

  const joiner = new ChunkJoiner(bee, reference, joinerOptions)
  return joiner.createReadableStream()
}

/**
 * Downloads a file from a manifest path as a streaming ReadableStream
 *
 * This function:
 * 1. Downloads and parses the manifest at the given reference
 * 2. Optionally decrypts the manifest if reference is 64 bytes
 * 3. Looks up the file at the specified path
 * 4. Uses parallel chunk fetching to stream the file data
 * 5. Returns file metadata along with the stream
 *
 * @param bee Bee instance
 * @param resource Swarm manifest reference
 * @param path Path within the manifest (e.g., 'index.html' or 'images/logo.png')
 * @param options Options including progress callback and concurrency
 * @param requestOptions Request options for HTTP calls
 * @returns FileData with ReadableStream and metadata (content-type, filename, etc.)
 *
 * @example
 * ```typescript
 * const file = await downloadFileStreaming(bee, manifestRef, 'document.pdf', {
 *   onDownloadProgress: ({ total, processed }) => {
 *     console.log(`Progress: ${(processed/total*100).toFixed(1)}%`)
 *   }
 * })
 *
 * console.log('Content-Type:', file.contentType)
 * console.log('Filename:', file.name)
 *
 * // Use the stream
 * const reader = file.data.getReader()
 * ```
 */
export async function downloadFileStreaming(
  bee: Bee,
  resource: Reference | Uint8Array | string,
  path = '',
  options?: DownloadStreamOptions,
  requestOptions?: BeeRequestOptions,
): Promise<FileData<ReadableStream<Uint8Array>>> {
  const manifestReference = new Reference(resource)

  // Download and unmarshal the manifest
  const manifest = await MantarayNode.unmarshal(bee, manifestReference, options, requestOptions)

  // Load the manifest tree recursively to access all paths
  await manifest.loadRecursively(bee, options, requestOptions)

  // Find the node at the specified path
  const node = path ? manifest.find(path) : manifest.find('/')

  if (!node) {
    throw new Error(`Path not found in manifest: ${path}`)
  }

  if (!node.targetAddress) {
    throw new Error(`No file at path: ${path}`)
  }

  // Extract file metadata from the manifest node
  const metadata = node.metadata || {}
  const fileReference = new Reference(node.targetAddress)

  // Create the streaming joiner for the file
  const joinerOptions: ChunkJoinerOptions = {
    onDownloadProgress: options?.onDownloadProgress,
    downloadOptions: options,
    requestOptions,
    concurrency: options?.concurrency,
  }

  const joiner = new ChunkJoiner(bee, fileReference, joinerOptions)
  const stream = await joiner.createReadableStream()

  // Parse metadata headers into FileData format
  // Note: Manifest metadata keys are like 'Content-Type', 'Filename', etc.
  const fileData: FileData<ReadableStream<Uint8Array>> = {
    name: metadata['Filename'] || path.split('/').pop() || '',
    data: stream,
  }

  // Add content-type if available
  if (metadata['Content-Type']) {
    fileData.contentType = metadata['Content-Type']
  }

  // Add content-length if we can determine it
  // We could fetch the file size from the joiner if needed
  // const size = await joiner.getSize()
  // fileData.size = Number(size)

  return fileData
}
