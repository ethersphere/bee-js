import { Bee } from '../bee'
import { makeContentAddressedChunk } from '../chunk/cac'
import {
  AnyJson,
  BatchId,
  BeeRequestOptions,
  CHUNK_SIZE,
  FeedReader,
  FeedWriter,
  JsonFeedOptions,
  UploadOptions,
  UploadResult,
} from '../types'
import { isError } from '../utils/type'

function serializeJson(data: AnyJson): Uint8Array {
  try {
    const jsonString = JSON.stringify(data)

    return new TextEncoder().encode(jsonString)
  } catch (e) {
    if (isError(e)) {
      e.message = `JsonFeed: ${e.message}`
    }
    throw e
  }
}

export async function getJsonData<T extends AnyJson>(bee: Bee, reader: FeedReader): Promise<T> {
  // TODO: implement
  throw new Error('Method not implemented.')
}

export async function setJsonData(
  bee: Bee,
  writer: FeedWriter,
  postageBatchId: BatchId,
  data: AnyJson,
  options?: JsonFeedOptions & UploadOptions,
  requestOptions?: BeeRequestOptions,
): Promise<UploadResult> {
  const serializedData = serializeJson(data)

  if (serializedData.length <= CHUNK_SIZE) {
    const cac = makeContentAddressedChunk(serializedData)

    return writer.upload(postageBatchId, cac.data, options, requestOptions)
  } else {
    // TODO create bmt tree
    const { reference } = await bee.uploadData(postageBatchId, serializedData, options, requestOptions)
    const rootChunk = await bee.downloadChunk(reference)

    return writer.upload(postageBatchId, rootChunk, { pin: options?.pin })
  }
}
