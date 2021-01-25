import { BeeResponse, UploadOptions } from '../types'
import { bytesToHex } from '../utils/hex'
import { Chunk } from './soc'
import * as chunkAPI from '../modules/chunk'

/**
 * Helper function to upload a chunk.
 *
 * It uses the Chunk API and calculates the address before uploading.
 *
 * @param url       The url of the Bee service
 * @param chunk     A chunk object
 * @param options   Upload options
 */
export function uploadChunk(url: string, chunk: Chunk, options?: UploadOptions): Promise<BeeResponse> {
  const address = chunk.address()
  const hash = bytesToHex(address)

  return chunkAPI.upload(url, hash, chunk.data, options)
}
