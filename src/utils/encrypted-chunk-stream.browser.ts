import { Bee, BeeRequestOptions, UploadOptions, UploadResult } from '..'
import { processEncryptedFiles, FileSource } from './encrypted-chunk-stream'
import { BatchId } from './typed-bytes'
import { UploadProgress } from './upload-progress'

const CHUNK_SIZE = 4096

/**
 * Streams and encrypts files for upload to Swarm (Browser version)
 *
 * This is similar to streamFiles but with encryption enabled.
 * Each chunk is encrypted with its own random key, and the reference
 * includes both the chunk address and encryption key (64 bytes total).
 *
 * @param bee Bee instance
 * @param files Files to upload
 * @param postageBatchId Postage batch ID
 * @param onUploadProgress Progress callback
 * @param options Upload options
 * @param requestOptions Request options
 */
export async function streamEncryptedFiles(
  bee: Bee,
  files: File[] | FileList,
  postageBatchId: BatchId,
  onUploadProgress?: (progress: UploadProgress) => void,
  options?: UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  // Convert browser Files to FileSource objects
  const fileSources: FileSource[] = Array.from(files).map(file => createBrowserFileSource(file))

  return processEncryptedFiles(bee, fileSources, postageBatchId, {
    onUploadProgress,
    uploadOptions: options,
    requestOptions,
  })
}

/**
 * Creates a FileSource for browser File objects
 */
function createBrowserFileSource(file: File): FileSource {
  return {
    name: file.name,
    relativePath: file.name,
    size: file.size,
    async readChunks(onChunk: (data: Uint8Array) => Promise<void>) {
      return new Promise<void>((resolve, reject) => {
        let offset = 0
        const reader = new FileReader()

        reader.onerror = () => {
          reject(reader.error)
        }

        const readNextChunk = async () => {
          if (offset >= file.size) {
            resolve()

            return
          }

          const slice = file.slice(offset, offset + CHUNK_SIZE)
          reader.readAsArrayBuffer(slice)
        }

        reader.onload = async event => {
          if (!event.target) {
            reject(new Error('No event target'))

            return
          }
          const data = event.target.result

          if (data) {
            const chunkData = new Uint8Array(data as ArrayBuffer)
            await onChunk(chunkData)
            offset += CHUNK_SIZE
          }
          readNextChunk()
        }

        readNextChunk()
      })
    },
  }
}

export async function hashDirectory(_dir: string) {
  throw new Error('Hashing directories is not supported in browsers!')
}
