import { DataFeed, FeedWriter, ReferenceResponse } from '../types'
import { Bee } from '../bee'

function serializeData(data: Record<string, unknown> | number | string): Uint8Array {
  if (typeof data === 'string') return new TextEncoder().encode(data)

  try {
    const jsonString = JSON.stringify(data)

    return new TextEncoder().encode(jsonString)
  } catch (e) {
    e.message = `DataFeed: ${e.message}`
    throw e
  }
}

function getData<T extends Record<string, unknown> | number | string>(bee: Bee, writer: FeedWriter): () => Promise<T> {
  return async () => {
    const feedUpdate = await writer.download()
    const retrievedData = await bee.downloadData(feedUpdate.reference)

    return JSON.parse(new TextDecoder().decode(retrievedData))
  }
}

function setData<T extends Record<string, unknown> | number | string>(
  bee: Bee,
  writer: FeedWriter,
): (data: T) => Promise<ReferenceResponse> {
  return async (data: T) => {
    const serializedData = serializeData(data)
    const reference = await bee.uploadData(serializedData)

    return writer.upload(reference)
  }
}

export function makeDataFeed<T extends Record<string, unknown> | number | string>(
  bee: Bee,
  writer: FeedWriter,
): DataFeed<T> {
  return {
    writer,
    get: getData<T>(bee, writer),
    set: setData<T>(bee, writer),
  }
}
