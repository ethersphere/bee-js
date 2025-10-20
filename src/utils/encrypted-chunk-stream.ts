import { AsyncQueue, Strings } from 'cafe-utility'
import * as fs from 'fs'
import * as path from 'path'
import { Bee, BeeRequestOptions, NULL_ADDRESS, UploadOptions, UploadResult } from '..'
import { MantarayNode } from '../manifest/manifest'
import { makeEncryptedContentAddressedChunk } from '../chunk/encrypted-cac'
import { totalChunks } from './chunk-size'
import { makeFilePath } from './collection'
import { mimes } from './mime'
import { BatchId, Reference } from './typed-bytes'
import { UploadProgress } from './upload-progress'

const CHUNK_SIZE = 4096

/**
 * File source interface - abstracts file reading for browser vs Node
 */
export interface FileSource {
  name: string
  relativePath: string
  size: number
  readChunks(onChunk: (data: Uint8Array) => Promise<void>): Promise<void>
}

/**
 * Options for processing encrypted files
 */
export interface EncryptedStreamOptions {
  onUploadProgress?: (progress: UploadProgress) => void
  uploadOptions?: UploadOptions
  requestOptions?: BeeRequestOptions
}

/**
 * Core logic for building encrypted merkle tree - shared between browser and Node
 */
export async function buildEncryptedMerkleTree(
  encryptedChunks: Array<{ address: Uint8Array; key: Uint8Array }>,
  onChunk: (payload: Uint8Array, address: Uint8Array) => Promise<void>,
): Promise<Reference> {
  // Single chunk case
  if (encryptedChunks.length === 1) {
    // Return 64-byte reference: address + key
    const ref = new Uint8Array(64)
    ref.set(encryptedChunks[0].address, 0)
    ref.set(encryptedChunks[0].key, 32)

    return new Reference(ref)
  }

  // Multi-chunk case: build intermediate chunks
  // Each intermediate chunk can hold 64 references (64 bytes each = 4096 bytes)
  const REFS_PER_CHUNK = 64
  const intermediateChunks: Array<{ address: Uint8Array; key: Uint8Array }> = []

  for (let i = 0; i < encryptedChunks.length; i += REFS_PER_CHUNK) {
    const refs = encryptedChunks.slice(i, Math.min(i + REFS_PER_CHUNK, encryptedChunks.length))

    // Build intermediate chunk payload containing all 64-byte references
    const payload = new Uint8Array(refs.length * 64)
    refs.forEach((ref, idx) => {
      payload.set(ref.address, idx * 64)
      payload.set(ref.key, idx * 64 + 32)
    })

    // Encrypt the intermediate chunk
    const encryptedIntermediate = makeEncryptedContentAddressedChunk(payload)

    intermediateChunks.push({
      address: encryptedIntermediate.address.toUint8Array(),
      key: encryptedIntermediate.encryptionKey,
    })

    // Upload intermediate chunk
    await onChunk(payload, encryptedIntermediate.address.toUint8Array())
  }

  // Recursively build tree if we have more than one intermediate chunk
  if (intermediateChunks.length > 1) {
    return buildEncryptedMerkleTree(intermediateChunks, onChunk)
  }

  // Return root reference (64 bytes)
  const rootRef = new Uint8Array(64)
  rootRef.set(intermediateChunks[0].address, 0)
  rootRef.set(intermediateChunks[0].key, 32)

  return new Reference(rootRef)
}

/**
 * Core function to process and upload encrypted files - shared between browser and Node
 */
export async function processEncryptedFiles(
  bee: Bee,
  fileSources: FileSource[],
  postageBatchId: BatchId,
  options: EncryptedStreamOptions = {},
): Promise<UploadResult> {
  const { onUploadProgress, uploadOptions, requestOptions } = options
  const queue = new AsyncQueue(64, 64)
  postageBatchId = new BatchId(postageBatchId)

  let total = 0
  let processed = 0

  // Calculate total chunks
  for (const file of fileSources) {
    total += totalChunks(file.size)
  }

  async function onChunkUpload(chunkPayload: Uint8Array) {
    await queue.enqueue(async () => {
      // Encrypt the chunk
      const encryptedChunk = makeEncryptedContentAddressedChunk(chunkPayload)

      // Upload the encrypted chunk data
      await bee.uploadChunk(postageBatchId, encryptedChunk.data, uploadOptions, requestOptions)

      onUploadProgress?.({ total, processed: ++processed })
    })
  }

  const mantaray = new MantarayNode()

  for (const fileSource of fileSources) {
    const encryptedChunks: Array<{ address: Uint8Array; key: Uint8Array }> = []

    // Read and encrypt file chunks
    await fileSource.readChunks(async chunkData => {
      // Encrypt chunk
      const encryptedChunk = makeEncryptedContentAddressedChunk(chunkData)

      // Store reference
      encryptedChunks.push({
        address: encryptedChunk.address.toUint8Array(),
        key: encryptedChunk.encryptionKey,
      })

      // Upload
      await onChunkUpload(chunkData)
    })

    await queue.drain()

    // Build encrypted merkle tree for this file
    const rootReference = await buildEncryptedMerkleTree(encryptedChunks, async (payload, address) => {
      await onChunkUpload(payload)
    })

    const { filename, extension } = Strings.parseFilename(fileSource.name)

    // Add to manifest with the encrypted root reference
    mantaray.addFork(makeFilePath({ name: fileSource.relativePath } as File), rootReference.toUint8Array(), {
      'Content-Type': maybeEnrichMime(mimes[extension.toLowerCase()] || 'application/octet-stream'),
      Filename: filename,
    })

    if (filename === 'index.html') {
      mantaray.addFork('/', NULL_ADDRESS, {
        'website-index-document': 'index.html',
      })
    }
  }

  // Upload the manifest as encrypted chunks recursively
  return saveEncryptedManifest(mantaray, bee, postageBatchId, uploadOptions, requestOptions)
}

/**
 * Saves the manifest with encryption, returning a 64-byte reference
 */
async function saveEncryptedManifest(
  node: MantarayNode,
  bee: Bee,
  postageBatchId: BatchId,
  uploadOptions?: UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  // Recursively save child nodes first
  for (const fork of node['forks'].values()) {
    await saveEncryptedManifest(fork.node, bee, postageBatchId, uploadOptions, requestOptions)
  }

  // Marshal the current node
  const marshalled = await node.marshal()

  // Encrypt the manifest chunk
  const encryptedChunk = makeEncryptedContentAddressedChunk(marshalled)

  // Upload the encrypted chunk data
  await bee.uploadChunk(postageBatchId, encryptedChunk.data, uploadOptions, requestOptions)

  // Create 64-byte reference: address + encryption key
  const encryptedRef = new Uint8Array(64)
  encryptedRef.set(encryptedChunk.address.toUint8Array(), 0)
  encryptedRef.set(encryptedChunk.encryptionKey, 32)

  // Set the node's self address to the full 64-byte encrypted reference
  node['selfAddress'] = encryptedRef

  return {
    reference: new Reference(encryptedRef),
    tagUid: undefined,
  }
}

/**
 * Streams and encrypts files for upload to Swarm (Node.js version)
 */
export async function streamEncryptedFiles(
  bee: Bee,
  dir: string,
  postageBatchId: BatchId,
  onUploadProgress?: (progress: UploadProgress) => void,
  options?: UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  // Get all files recursively and create FileSource objects
  const filePaths = getAllFiles(dir)
  const fileSources: FileSource[] = filePaths.map(filePath => createNodeFileSource(filePath, dir))

  return processEncryptedFiles(bee, fileSources, postageBatchId, {
    onUploadProgress,
    uploadOptions: options,
    requestOptions,
  })
}

/**
 * Creates a FileSource for Node.js file system
 */
function createNodeFileSource(filePath: string, baseDir: string): FileSource {
  const stats = fs.statSync(filePath)
  const relativePath = path.relative(baseDir, filePath)

  return {
    name: path.basename(filePath),
    relativePath,
    size: stats.size,
    async readChunks(onChunk: (data: Uint8Array) => Promise<void>) {
      const fileContent = fs.readFileSync(filePath)
      for (let offset = 0; offset < fileContent.length; offset += CHUNK_SIZE) {
        const chunkData = fileContent.slice(offset, Math.min(offset + CHUNK_SIZE, fileContent.length))
        await onChunk(chunkData)
      }
    },
  }
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const filePath = path.join(dirPath, file)

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(filePath)
    }
  })

  return arrayOfFiles
}

function maybeEnrichMime(mime: string) {
  if (['text/html', 'text/css'].includes(mime)) {
    return `${mime}; charset=utf-8`
  }

  return mime
}

export async function hashDirectory(_dir: string) {
  throw new Error('Hashing directories is not yet implemented for encrypted uploads')
}
