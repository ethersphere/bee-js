import { AsyncQueue, Chunk, MerkleTree, Strings } from 'cafe-utility'
import { createReadStream } from 'fs'
import { Bee, BeeRequestOptions, UploadOptions } from '..'
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
  options?: UploadOptions,
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
  const mantaray = new MantarayNode()
  for (const file of files) {
    if (!file.fsPath) {
      throw Error('File does not have fsPath, which should never happen in node. Please report this issue.')
    }
    const readStream = createReadStream(file.fsPath)

    async function onChunk(chunk: Chunk) {
      await queue.enqueue(async () => {
        await bee.uploadChunk(postageBatchId, chunk.build(), options, requestOptions)
        onUploadProgress?.({ total, processed: ++processed })
      })
    }

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
  }
  return mantaray.saveRecursively(bee, postageBatchId, options, requestOptions)
}

function maybeEnrichMime(mime: string) {
  if (['text/html', 'text/css'].includes(mime)) {
    return `${mime}; charset=utf-8`
  }

  return mime
}
