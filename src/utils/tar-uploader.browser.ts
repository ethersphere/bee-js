import { BatchId } from '@ethersphere/core-sdk'
import { BeeRequestOptions, Collection, CollectionUploadOptions } from '../index.js'
import { prepareRequestHeaders } from './headers.js'
import { http } from './http.js'
import { TarStream } from './tar.js'
import { writeTar } from './tar-writer.js'

const bzzEndpoint = 'bzz'

export async function uploadTar(
  requestOptions: BeeRequestOptions,
  collection: Collection,
  postageBatchId: BatchId,
  options?: CollectionUploadOptions,
) {
  const tarStream = new TarStream()
  await writeTar(collection, tarStream)
  await tarStream.end()
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: bzzEndpoint,
    data: tarStream.output,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      'swarm-collection': 'true',
      ...prepareRequestHeaders(postageBatchId, options),
    },
  })

  return response
}
