import { FeedWriter, FeedReader, AnyJson, BatchId, Reference, RequestOptions } from '../types/index.js'
import { Bee } from '../bee.js'
import { isError } from '../utils/type.js'

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
  options?: RequestOptions,
): Promise<Reference> {
  const serializedData = serializeJson(data)
  const { reference } = await bee.uploadData(postageBatchId, serializedData, options)

  return writer.upload(postageBatchId, reference)
}
