import { AsyncQueue, Chunk, MerkleTree, Strings } from 'cafe-utility'
import { createReadStream } from 'fs'
import { Bee, BeeRequestOptions, CollectionUploadOptions, NULL_ADDRESS, UploadOptions, UploadResult } from '..'
import { MantarayNode } from '../manifest/manifest'
import { totalChunks } from './chunk-size'
import { makeCollectionFromFS } from './collection.node'
import { mimes } from './mime'
import { BatchId } from './typed-bytes'
import { UploadProgress } from './upload-progress'

export async function hashDirectory(dir: string) {
  const files = await makeCollectionFromFS(dir)
  const mantaray = new MantarayNode()
  for (const file of files) {
    const tree = new MerkleTree(MerkleTree.NOOP)

    if (!file.fsPath) {
      throw Error('File does not have fsPath, which should never happen in node. Please report this issue.')
    }
    const readStream = createReadStream(file.fsPath)
    for await (const data of readStream) {
      await tree.append(data)
    }
    const rootChunk = await tree.finalize()
    const { filename, extension } = Strings.parseFilename(file.path)
    mantaray.addFork(file.path, rootChunk.hash(), {
      'Content-Type': maybeEnrichMime(mimes[extension.toLowerCase()] || 'application/octet-stream'),
      Filename: filename,
    })
  }

  return mantaray.calculateSelfAddress()
}

export async function streamDirectory(
  bee: Bee,
  dir: string,
  postageBatchId: BatchId | string | Uint8Array,
  onUploadProgress?: (progress: UploadProgress) => void,
  options?: CollectionUploadOptions,
  requestOptions?: BeeRequestOptions,
) {
  const queue = new AsyncQueue(64, 64)
  let total = 0
  let processed = 0
  postageBatchId = new BatchId(postageBatchId)
  const files = await makeCollectionFromFS(dir)
  for (const file of files) {
    total += totalChunks(file.size)
  }

  let hasIndexHtml = false

  async function onChunk(chunk: Chunk) {
    await queue.enqueue(async () => {
      await bee.uploadChunk(postageBatchId, chunk.build(), options, requestOptions)
      onUploadProgress?.({ total, processed: ++processed })
    })
  }
  const mantaray = new MantarayNode()
  for (const file of files) {
    if (!file.fsPath) {
      throw Error('File does not have fsPath, which should never happen in node. Please report this issue.')
    }
    const readStream = createReadStream(file.fsPath)

    const tree = new MerkleTree(onChunk)
    for await (const data of readStream) {
      await tree.append(data)
    }
    const rootChunk = await tree.finalize()
    await queue.drain()
    const { filename, extension } = Strings.parseFilename(file.path)
    mantaray.addFork(file.path, rootChunk.hash(), {
      'Content-Type': maybeEnrichMime(mimes[extension.toLowerCase()] || 'application/octet-stream'),
      Filename: filename,
    })

    if (file.path === 'index.html') {
      hasIndexHtml = true
    }
  }

  if (hasIndexHtml || options?.indexDocument || options?.errorDocument) {
    const metadata: Record<string, string> = {}

    if (options?.indexDocument) {
      metadata['website-index-document'] = options.indexDocument
    } else if (hasIndexHtml) {
      metadata['website-index-document'] = 'index.html'
    }

    if (options?.errorDocument) {
      metadata['website-error-document'] = options.errorDocument
    }
    mantaray.addFork('/', NULL_ADDRESS, metadata)
  }

  return mantaray.saveRecursively(bee, postageBatchId, options, requestOptions)
}

function maybeEnrichMime(mime: string) {
  if (['text/html', 'text/css'].includes(mime)) {
    return `${mime}; charset=utf-8`
  }

  return mime
}

export async function streamFiles(
  _bee: Bee,
  _files: File[] | FileList,
  _postageBatchId: BatchId,
  _onUploadProgress?: (progress: UploadProgress) => void,
  _options?: UploadOptions,
  _requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  throw new Error('Streaming files is not supported in Node.js')
}
