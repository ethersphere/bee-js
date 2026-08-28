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

test('catchUp is not fooled by an older buried gap', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(0)
  await writer.uploadPayload(batch(), 'Old payload', { deferred: false })
  // period 2 is a deliberate buried gap: never written, never mirrored into

  setPeriod(3)
  await writer.uploadPayload(batch(), 'Recent payload', { deferred: false })
  // populated so far: 0, 1, 3, 4 -- with a hole at 2

  expect(await writer.isCaughtUp(6)).toBe(false)
  await writer.catchUp(batch(), 6)
  expect(await writer.isCaughtUp(6)).toBe(true)

  setPeriod(6)
  const result = await reader.downloadPayload()
  // must resume from the recent (period 4) content, not the one from before the buried gap
  expect(result.payload.toUtf8()).toBe('Recent payload')
})

test('catchUp fails cleanly, without scanning past period 0, when nothing was ever written', async () => {
  const { writer } = makeWriterAndReader()

  await expect(writer.catchUp(batch(), 5)).rejects.toThrow('No populated period found')
})

test('a non-positive periodLength is rejected', async () => {
  const privateKey = new PrivateKey(Strings.randomHex(64))
  const writer = bee.rollingFeed.makeWriter(new Topic(Strings.randomHex(64)), privateKey, 0)

  await expect(writer.isCaughtUp()).rejects.toThrow('Period length must be greater than zero')
})
