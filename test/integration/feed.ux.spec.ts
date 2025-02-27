import { Dates, Strings, System } from 'cafe-utility'
import { FeedIndex, NULL_TOPIC, PrivateKey } from '../../src'
import { batch, makeBee } from '../utils'

test('Feed read/write as payload', async () => {
  const bee = makeBee()
  const privateKey = new PrivateKey(Strings.randomHex(64))

  const writer = bee.makeFeedWriter(NULL_TOPIC, privateKey)
  writer.uploadPayload(batch(), 'Feed payload', { deferred: false })

  await System.waitFor(
    () => bee.isFeedRetrievable(writer.owner, writer.topic, FeedIndex.fromBigInt(0n)),
    Dates.seconds(1),
    30,
  )

  const explicitIndexReadResult = await writer.downloadPayload({ index: 0 })
  expect(explicitIndexReadResult.payload.toUtf8()).toBe('Feed payload')

  const latestReadResult = await writer.downloadPayload()
  expect(latestReadResult.payload.toUtf8()).toBe('Feed payload')
})

test('Feed read/write as reference', async () => {
  const bee = makeBee()
  const privateKey = new PrivateKey(Strings.randomHex(64))

  const uploadResult = await bee.uploadData(batch(), 'Some payload')

  const writer = bee.makeFeedWriter(NULL_TOPIC, privateKey)
  await writer.uploadReference(batch(), uploadResult.reference)

  await System.waitFor(
    () => bee.isFeedRetrievable(writer.owner, writer.topic, FeedIndex.fromBigInt(0n)),
    Dates.seconds(1),
    30,
  )

  const explicitIndexReadResult = await writer.downloadReference({ index: 0, hasTimestamp: true })
  expect(explicitIndexReadResult.reference.toHex()).toBe(uploadResult.reference.toHex())

  const latestReadResult = await writer.downloadReference({ hasTimestamp: true })
  expect(latestReadResult.reference.toHex()).toBe(uploadResult.reference.toHex())
})

test('Feed read/write 40 bytes payload', async () => {
  const bee = makeBee()
  const privateKey = new PrivateKey(Strings.randomHex(64))

  const writer = bee.makeFeedWriter(NULL_TOPIC, privateKey)
  writer.uploadPayload(batch(), 'This string is exactly 40 bytes in utf-8', { deferred: false })

  await System.waitFor(
    () => bee.isFeedRetrievable(writer.owner, writer.topic, FeedIndex.fromBigInt(0n)),
    Dates.seconds(1),
    30,
  )

  const latestReadResult = await writer.downloadPayload()
  expect(latestReadResult.payload.toUtf8()).toBe('This string is exactly 40 bytes in utf-8')
})
