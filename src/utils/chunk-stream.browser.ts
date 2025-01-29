import { Chunk, MerkleTree, Strings } from 'cafe-utility'
import { Bee, UploadOptions } from '..'
import { MantarayNode } from '../manifest/manifest'
import { totalChunks } from './chunk-size'
import { mimes } from './mime'
import { BatchId } from './typed-bytes'
import { UploadProgress } from './upload-progress'

export async function streamFiles(
  bee: Bee,
  files: File[],
  postageBatchId: BatchId | string | Uint8Array,
  onUploadProgress?: (progress: UploadProgress) => void,
  options?: UploadOptions,
) {
  let total = 0
  let processed = 0
  for (const file of files) {
    total += totalChunks(file.size)
  }
  postageBatchId = new BatchId(postageBatchId)
  const mantaray = new MantarayNode()
  for (const file of files) {
    const rootChunk = await new Promise<Chunk>((resolve, reject) => {
      const tree = new MerkleTree(async chunk => {
        await bee.uploadChunk(postageBatchId, chunk.build(), options)
        onUploadProgress?.({ total, processed: ++processed })
      })

      let offset = 0

      const reader = new FileReader()

      reader.onerror = () => {
        reject(reader.error)
      }

      const readNextChunk = () => {
        if (offset >= file.size) {
          tree.finalize().then(resolve)
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
          tree.append(new Uint8Array(data as ArrayBuffer))
          offset += 4096
        }
        readNextChunk()
      }

      readNextChunk()
    })
    const { filename, extension } = Strings.parseFilename(file.name)
    mantaray.addFork(file.name, rootChunk.hash(), {
      'Content-Type': mimes[extension.toLowerCase()] || 'application/octet-stream',
      Filename: filename,
    })
  }
  return mantaray.saveRecursively(bee, postageBatchId)
}
