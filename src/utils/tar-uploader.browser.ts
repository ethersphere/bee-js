import { BeeRequestOptions, Collection, CollectionUploadOptions } from '..'
import { prepareRequestHeaders } from './headers'
import { http } from './http'
import { TarStream } from './tar'
import { writeTar } from './tar-writer'
import { BatchId } from './typed-bytes'

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
