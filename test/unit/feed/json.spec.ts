import { AnyJson, Reference } from '../../../src'
import { getJsonData, setJsonData } from '../../../src/feed/json'
import { FetchFeedUpdateResponse } from '../../../src/modules/feed'
import { wrapBytesWithHelpers } from '../../../src/utils/bytes'
import { testAddress, testBatchId, testChunkHash } from '../../utils'

interface CircularReference {
  otherData: 123
  myself?: CircularReference
}

describe('JsonFeed', () => {
  const DATA_REFERENCE: Reference = testChunkHash
  const FEED_REFERENCE_HASH = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a1111' as Reference
  const FEED_REFERENCE = {
    reference: FEED_REFERENCE_HASH,
  } as FetchFeedUpdateResponse

  function testSet(data: unknown, expectedBytes: Uint8Array): void {
    it(`should set feed for data: ${data}`, async () => {
      const bee = {
        uploadData: () => ({ reference: DATA_REFERENCE, tagUid: 0, historyAddress: '00'.repeat(32) }),
      } as any
      const writer = { upload: () => ({ reference: FEED_REFERENCE_HASH, historyAddress: '00'.repeat(32) }) } as any

      expect((await setJsonData(bee, writer, testAddress, data as AnyJson)).reference).toBe(FEED_REFERENCE_HASH)
    })

    it(`should get feed for data: ${data}`, async () => {
      const bee = { downloadData: () => wrapBytesWithHelpers(expectedBytes) } as any
      const writer = { download: () => FEED_REFERENCE } as any

      expect(await getJsonData(bee, writer)).toStrictEqual(data)
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
    const bee = {} as any
    const writer = {} as any
    await expect(setJsonData(bee, writer, testAddress, BigInt(123) as unknown as AnyJson)).rejects.toThrow(TypeError)

    const circularReference: CircularReference = { otherData: 123 }
    circularReference.myself = circularReference

    // @ts-ignore: Circular references are detected with TS, so we have to ts-ignore to test it.
    await expect(setJsonData(bee, writer, testBatchId, circularReference)).rejects.toThrow(TypeError)
  })
})
