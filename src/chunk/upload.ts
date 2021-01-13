import { BeeResponse, UploadOptions } from "../types";
import { byteArrayToHex } from '../utils/hex'
import { Chunk } from './soc'
import * as chunkAPI from '../modules/chunk'

export function uploadChunk(url: string, chunk: Chunk, options?: UploadOptions): Promise<BeeResponse> {
  const data = chunk.serialize()
  const address = chunk.address()
  const hash = byteArrayToHex(address)
  return chunkAPI.upload(url, hash, data, options)
}
