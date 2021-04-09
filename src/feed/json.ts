import { JsonFeed, FeedWriter, ReferenceResponse, FeedReader, AnyJson } from '../types'
import { Bee } from '../bee'

function serializeJson(data: AnyJson): Uint8Array {
  try {
    const jsonString = JSON.stringify(data)

    return new TextEncoder().encode(jsonString)
  } catch (e) {
    e.message = `DataFeed: ${e.message}`
    throw e
  }
}

function getJsonData<T extends AnyJson>(bee: Bee, reader: FeedReader): () => Promise<T> {
  return async () => {
    const feedUpdate = await reader.download()
    const retrievedData = await bee.downloadData(feedUpdate.reference)

    return retrievedData.json() as T
  }
}

function setJsonData(bee: Bee, writer: FeedWriter): (data: AnyJson) => Promise<ReferenceResponse> {
  return async (data: AnyJson) => {
    const serializedData = serializeJson(data)
    const reference = await bee.uploadData(serializedData)

    return writer.upload(reference)
  }
}

export function makeJsonFeed<T extends AnyJson>(bee: Bee, writer: FeedWriter): JsonFeed<T> {
  return {
    writer,
    get: getJsonData<T>(bee, writer),
    set: setJsonData(bee, writer),
  }
}
