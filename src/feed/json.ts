import { Bee } from '../bee'
import {
  AnyJson,
  BatchId,
  BeeRequestOptions,
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
  const feedUpdate = await reader.download()
  const retrievedData = await bee.downloadData(feedUpdate.reference)

  return retrievedData.json() as T
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
  const { reference } = await bee.uploadData(postageBatchId, serializedData, options, requestOptions)

  return writer.upload(postageBatchId, reference, { pin: options?.pin })
}
