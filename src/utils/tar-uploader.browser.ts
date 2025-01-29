import { Types } from 'cafe-utility'
import { BeeRequestOptions, Collection, CollectionUploadOptions, UploadRedundancyOptions } from '..'
import { extractCollectionUploadHeaders } from '../modules/bzz'
import { http } from './http'
import { TarStream } from './tar'
import { writeTar } from './tar-writer'
import { BatchId, Reference } from './typed-bytes'

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
  const response = await http<unknown>(requestOptions, {
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    reference: new Reference(Types.asString(body.reference, { name: 'reference' })),
  }
}
