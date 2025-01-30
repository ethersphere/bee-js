import { AsyncQueue, Chunk, MerkleTree, Strings } from 'cafe-utility'
import { Bee, BeeRequestOptions, NULL_ADDRESS, UploadOptions } from '..'
import { MantarayNode } from '../manifest/manifest'
import { totalChunks } from './chunk-size'
import { makeFilePath } from './collection'
import { mimes } from './mime'
import { BatchId, Reference } from './typed-bytes'
import { UploadProgress } from './upload-progress'

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
): Promise<Reference> {
  const queue = new AsyncQueue(64, 64)
  let total = 0
  let processed = 0
  for (const file of files) {
    total += totalChunks(file.size)
  }
  postageBatchId = new BatchId(postageBatchId)

  async function onChunk(chunk: Chunk) {
    await queue.enqueue(async () => {
      await bee.uploadChunk(postageBatchId, chunk.build(), options)
      onUploadProgress?.({ total, processed: ++processed })
    })
  }
  const mantaray = new MantarayNode()
  for (const file of files) {
    const rootChunk = await new Promise<Chunk>((resolve, reject) => {
      const tree = new MerkleTree(onChunk)

      let offset = 0

      const reader = new FileReader()

      reader.onerror = () => {
        reject(reader.error)
      }

      const readNextChunk = async () => {
        if (offset >= file.size) {
          const rootChunk = await tree.finalize()
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

  return mantaray.saveRecursively(bee, postageBatchId)
}

function maybeEnrichMime(mime: string) {
  if (['text/html', 'text/css'].includes(mime)) {
    return `${mime}; charset=utf-8`
  }

  return mime
}
