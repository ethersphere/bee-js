import { Dates, Strings, System } from 'cafe-utility'
import { NULL_TOPIC } from '../../src'
import { FeedIndex, PrivateKey, Reference } from '../../src/utils/typed-bytes'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('POST feed (reader)', async () => {
  const privateKey = new PrivateKey(Strings.randomHex(64))
  const owner = privateKey.publicKey().address()

  const response1 = await bee.uploadData(batch(), 'First update')
  const response2 = await bee.uploadData(batch(), 'Second update')

  const feedWriter = bee.makeFeedWriter(NULL_TOPIC, privateKey)
  const feedReader = bee.makeFeedReader(NULL_TOPIC, owner)

  await feedWriter.upload(batch(), response1.reference, { deferred: false })
  expect((await feedReader.download()).payload.toUtf8()).toBe('First update')

  await feedWriter.upload(batch(), response2.reference, { deferred: false })

  await System.waitFor(
    async () => {
      const payload = (await feedReader.download()).payload.toUtf8()

      return payload === 'Second update'
    },
    { attempts: 60, waitMillis: Dates.seconds(1) },
  )

  // TODO: this is a reference... should it be auto-resolved?
  const reference1 = new Reference((await feedReader.download({ index: 0 })).payload)
  expect((await bee.downloadData(reference1)).toUtf8()).toBe('First update')

  const reference2 = new Reference((await feedReader.download({ index: 1 })).payload)
  expect((await bee.downloadData(reference2)).toUtf8()).toBe('Second update')

  expect(await bee.isFeedRetrievable(owner, NULL_TOPIC)).toBe(true)
  expect(await bee.isFeedRetrievable(owner, NULL_TOPIC, FeedIndex.fromBigInt(1n))).toBe(true)
})

test('POST feed (manifest)', async () => {
  const privateKey = new PrivateKey(Strings.randomHex(64))
  const owner = privateKey.publicKey().address()

  const manifest = await bee.createFeedManifest(batch(), NULL_TOPIC, owner)

  const response1 = await bee.uploadFile(batch(), 'First update')
  const response2 = await bee.uploadFile(batch(), 'Second update')

  const feedWriter = bee.makeFeedWriter(NULL_TOPIC, privateKey)

  await feedWriter.upload(batch(), response1.reference, { deferred: false })

  await System.waitFor(
    async () => {
      const payload = (await bee.downloadFile(manifest)).data.toUtf8()

      return payload === 'First update'
    },
    { attempts: 60, waitMillis: Dates.seconds(1) },
  )

  await feedWriter.upload(batch(), response2.reference, { deferred: false })

  await System.waitFor(
    async () => {
      const payload = (await bee.downloadFile(manifest)).data.toUtf8()

      return payload === 'Second update'
    },
    { attempts: 60, waitMillis: Dates.seconds(1) },
  )

  expect(await bee.isFeedRetrievable(owner, NULL_TOPIC)).toBe(true)
  expect(await bee.isFeedRetrievable(owner, NULL_TOPIC, FeedIndex.fromBigInt(1n))).toBe(true)
})
