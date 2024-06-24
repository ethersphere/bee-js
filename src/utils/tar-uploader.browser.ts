import { BatchId, BeeRequestOptions, Collection, CollectionUploadOptions, Reference, UploadRedundancyOptions } from '..'
import { extractCollectionUploadHeaders } from '../modules/bzz'
import { http } from './http'
import { TarStream } from './tar'
import { writeTar } from './tar-writer'

const bzzEndpoint = 'bzz'

export async function uploadTar(
  requestOptions: BeeRequestOptions,
  collection: Collection,
  postageBatchId: BatchId,
  options?: CollectionUploadOptions & UploadRedundancyOptions,
) {
  const tarStream = new TarStream()
  await writeTar(collection, tarStream)
  await tarStream.end()
  const response = await http<{ reference: Reference }>(requestOptions, {
    method: 'post',
    url: bzzEndpoint,
    data: tarStream.output,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      'swarm-collection': 'true',
      ...extractCollectionUploadHeaders(postageBatchId, options),
    },
  })

  return response
}
