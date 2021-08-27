import { FeedWriter, FeedReader, AnyJson, BatchId, Reference } from '../types'
import { Bee } from '../bee'

function serializeJson(data: AnyJson): Uint8Array {
  try {
    const jsonString = JSON.stringify(data)

    return new TextEncoder().encode(jsonString)
  } catch (e) {
    e.message = `JsonFeed: ${e.message}`
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
): Promise<Reference> {
  const serializedData = serializeJson(data)
  const reference = await bee.uploadData(postageBatchId, serializedData)

  return writer.upload(postageBatchId, reference.reference)
}
