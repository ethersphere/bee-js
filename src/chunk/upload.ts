import { ReferenceResponse, UploadOptions } from '../types'
import { bytesToHex } from '../utils/hex'
import * as socAPI from '../modules/soc'
import { SingleOwnerChunk } from './soc'

/**
 * Helper function to upload a chunk.
 *
 * It uses the Chunk API and calculates the address before uploading.
 *
 * @param url       The url of the Bee service
 * @param chunk     A chunk object
 * @param options   Upload options
 */
export function uploadSingleOwnerChunk(url: string, chunk: SingleOwnerChunk, options?: UploadOptions): Promise<ReferenceResponse> {
  const owner = bytesToHex(chunk.owner())
  const identifier = bytesToHex(chunk.identifier())
  const signature = bytesToHex(chunk.signature())

  return socAPI.upload(url, owner, identifier, signature, chunk.data, options)
}
