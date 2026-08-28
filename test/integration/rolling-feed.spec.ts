import { Strings } from 'cafe-utility'
import { PrivateKey, Topic } from '@ethersphere/core-sdk'
import { batch, makeBee } from '../utils'

const bee = makeBee()

const PERIOD_LENGTH = 5 // seconds

let dateNowSpy: jest.SpiedFunction<typeof Date.now> | undefined

afterEach(() => {
  dateNowSpy?.mockRestore()
  dateNowSpy = undefined
})

// Topics are a pure function of the period index, which the SDK derives from Date.now() alone
// (no server-side clock involved) - freezing it lets tests jump between periods instantly
// instead of waiting on the real wall clock.
function setPeriod(period: number): void {
  dateNowSpy?.mockRestore()
  dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(period * PERIOD_LENGTH * 1000)
}

function makeWriterAndReader() {
  const privateKey = new PrivateKey(Strings.randomHex(64))
  const owner = privateKey.publicKey().address()
  const baseTopic = new Topic(Strings.randomHex(64))

  return {
    writer: bee.rollingFeed.makeWriter(baseTopic, privateKey, PERIOD_LENGTH),
    reader: bee.rollingFeed.makeReader(baseTopic, owner, PERIOD_LENGTH),
  }
}

test('uploadPayload / downloadPayload roundtrip', async () => {
  const { writer, reader } = makeWriterAndReader()
  setPeriod(1000)

  await writer.uploadPayload(batch(), 'Hello rolling feed', { deferred: false })

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Hello rolling feed')
})

test('uploadPayload mirrors into the next period', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Mirrored payload', { deferred: false })

  setPeriod(1001)
  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Mirrored payload')
})

test('downloadPayload falls back to the previous period when the current one is empty', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Last known payload', { deferred: false })

  // period 1001 got mirrored, period 1002 was never written at all
  setPeriod(1002)
  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Last known payload')
})

test('uploadReference / downloadReference roundtrip', async () => {
  const { writer, reader } = makeWriterAndReader()
  setPeriod(1000)

  const uploaded = await bee.data.upload(batch(), 'Referenced content')
  await writer.uploadReference(batch(), uploaded.reference, { deferred: false })

  const result = await reader.downloadReference()
  expect(result.reference.toHex()).toBe(uploaded.reference.toHex())
})

test('isCaughtUp is true for a written/mirrored period and false past a gap', async () => {
  const { writer } = makeWriterAndReader()
  setPeriod(1000)

  await writer.uploadPayload(batch(), 'Still going', { deferred: false })

  expect(await writer.isCaughtUp(1000)).toBe(true)
  expect(await writer.isCaughtUp(1001)).toBe(true)
  expect(await writer.isCaughtUp(1005)).toBe(false)
})

test('catchUp backfills a gap so the reader resolves it again', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Backfilled payload', { deferred: false })

  expect(await writer.isCaughtUp(1003)).toBe(false)
  await writer.catchUp(batch(), 1003)
  expect(await writer.isCaughtUp(1003)).toBe(true)

  setPeriod(1003)
  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Backfilled payload')
})
