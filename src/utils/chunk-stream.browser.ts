import { AsyncQueue, Strings } from 'cafe-utility'
import { Bee, BeeRequestOptions, NULL_ADDRESS, UploadOptions, UploadResult } from '..'
import { MantarayNode } from '../manifest/manifest'
import { totalChunks } from './chunk-size'
import { makeFilePath } from './collection'
import { mimes } from './mime'
import { BatchId, Reference } from './typed-bytes'
import { UploadProgress } from './upload-progress'
import { ChunkBuilder, ChunkEntry, ChunkSplitter } from 'swarm-core/chunk'

export async function hashDirectory(_dir: string) {
  throw new Error('Hashing directories is not supported in browsers!')
}

export async function streamDirectory(
  _bee: Bee,
  _dir: string,
  _postageBatchId: BatchId | string | Uint8Array,
  _onUploadProgress?: (progress: UploadProgress) => void,
  _options?: UploadOptions,
  _requestOptions?: BeeRequestOptions,
): Promise<Reference> {
  throw new Error('Streaming directories is not supported in browsers!')
}

export async function streamFiles(
  bee: Bee,
  files: File[] | FileList,
  postageBatchId: BatchId,
  onUploadProgress?: (progress: UploadProgress) => void,
  options?: UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  const signal = requestOptions?.signal

  if (signal?.aborted) {
    throw new Error('Request aborted')
  }

  const queue = new AsyncQueue(64, 64)
  let total = 0
  let processed = 0
  for (const file of files) {
    total += totalChunks(file.size)
  }
  postageBatchId = new BatchId(postageBatchId)

  async function uploadAndTrack(chunk: { build: () => Uint8Array }) {
    if (signal?.aborted) {
      return
    }
    try {
      await bee.uploadChunk(postageBatchId, chunk.build(), options, requestOptions)
      onUploadProgress?.({ total, processed: ++processed })
    } catch (err) {
      if (signal?.aborted) {
        return
      }
      throw err
    }
  }

  async function onBatch(batch: ChunkEntry[]): Promise<ChunkEntry[]> {
    for (const { chunk } of batch) {
      await queue.enqueue(async () => uploadAndTrack(chunk))
    }

    return []
  }
  const mantaray = new MantarayNode()
  for (const file of files) {
    if (signal?.aborted) {
      throw new Error('Request aborted')
    }

    const rootChunk = await new Promise<ChunkBuilder>((resolve, reject) => {
      const tree = new ChunkSplitter(onBatch)

      let offset = 0

      const reader = new FileReader()

      reader.onerror = () => {
        reject(reader.error)
      }

      const readNextChunk = async () => {
        if (signal?.aborted) {
          reject(new Error('Request aborted'))

          return
        }

        if (offset >= file.size) {
          // ChunkSplitter's onBatch only sees chunks once they're referenced
          // by a parent - the root chunk returned by finalize() is never
          // passed to it, so it has to be uploaded here explicitly.
          const rootChunk = await tree.finalize()
          await queue.enqueue(async () => uploadAndTrack(rootChunk))
          resolve(rootChunk)

          return
        }

        const slice = file.slice(offset, offset + 4096)
        reader.readAsArrayBuffer(slice)
      }

      reader.onload = async event => {
        if (!event.target) {
          reject('No event target')

          return
        }
        const data = event.target.result

        if (data) {
          await tree.append(new Uint8Array(data as ArrayBuffer))
          offset += 4096
        }
        readNextChunk()
      }

      readNextChunk()
    })
    await queue.drain()
    const { filename, extension } = Strings.parseFilename(file.name)
    mantaray.addFork(makeFilePath(file), rootChunk.hash(), {
      'Content-Type': maybeEnrichMime(mimes[extension.toLowerCase()] || 'application/octet-stream'),
      Filename: filename,
    })

    if (file.name === 'index.html') {
      mantaray.addFork('/', NULL_ADDRESS, {
        'website-index-document': 'index.html',
      })
    }
  }

  if (signal?.aborted) {
    throw new Error('Request aborted')
  }

  return mantaray.saveRecursively(bee, postageBatchId, options, requestOptions)
}

function maybeEnrichMime(mime: string) {
  if (['text/html', 'text/css'].includes(mime)) {
    return `${mime}; charset=utf-8`
  }

  return mime
}
