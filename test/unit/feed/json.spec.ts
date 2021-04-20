import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { AnyJson, Bee, FeedWriter, Reference } from '../../../src'
import { testChunkHash } from '../../utils'
import { getJsonData, setJsonData } from '../../../src/feed/json'
import { FetchFeedUpdateResponse } from '../../../src/modules/feed'
import { wrapBytesWithHelpers } from '../../../src/utils/bytes'

interface CircularReference {
  otherData: 123
  myself?: CircularReference
}

describe('JsonFeed', () => {
  const DATA_REFERENCE = testChunkHash as Reference
  const FEED_REFERENCE_HASH = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a1111'
  const FEED_REFERENCE = {
    reference: FEED_REFERENCE_HASH,
  } as FetchFeedUpdateResponse

  function testSet(data: unknown, expectedBytes: Uint8Array): void {
    it(`should set feed for data: ${data}`, async () => {
      const bee = Substitute.for<Bee>()
      bee.uploadData(Arg.all()).resolves(DATA_REFERENCE)

      const writer = Substitute.for<FeedWriter>()
      writer.upload(Arg.all()).resolves(FEED_REFERENCE)

      await expect(setJsonData(bee, writer, data as AnyJson)).resolves.toEqual(FEED_REFERENCE)
      bee.received(1).uploadData(expectedBytes)
      writer.received(1).upload(DATA_REFERENCE)
    })

    it(`should get feed for data: ${data}`, async () => {
      const bee = Substitute.for<Bee>()
      bee.downloadData(Arg.all()).resolves(wrapBytesWithHelpers(expectedBytes))

      const writer = Substitute.for<FeedWriter>()
      writer.download().resolves(FEED_REFERENCE)

      await expect(getJsonData(bee, writer)).resolves.toEqual(data)
      bee.received(1).downloadData(FEED_REFERENCE_HASH)
      writer.received(1).download()
    })
  }

  testSet('', Uint8Array.from([34, 34]))
  testSet('hello world', Uint8Array.from([34, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 34]))
  testSet(null, Uint8Array.from([110, 117, 108, 108]))
  testSet(true, Uint8Array.from([116, 114, 117, 101]))
  testSet(10, Uint8Array.from([49, 48]))
  testSet([], Uint8Array.from([91, 93]))
  testSet(
    [1, 'hello', null],
    Uint8Array.from([91, 49, 44, 34, 104, 101, 108, 108, 111, 34, 44, 110, 117, 108, 108, 93]),
  )
  // prettier-ignore
  testSet(
    { hello: 'world', from: null },
    Uint8Array.from([123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 44, 34, 102, 114, 111, 109, 34, 58, 110, 117, 108, 108, 125]),
  )

  it(`should fail for non-serializable data`, async () => {
    const bee = Substitute.for<Bee>()
    const writer = Substitute.for<FeedWriter>()
    await expect(setJsonData(bee, writer, (BigInt(123) as unknown) as AnyJson)).resolves.toEqual(FEED_REFERENCE)

    const circularReference: CircularReference = { otherData: 123 }
    circularReference.myself = circularReference

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Circular references are detected with TS, so we have to ts-ignore to test it.
    await expect(feed.set(circularReference)).rejects.toThrow(TypeError)
  })
})
