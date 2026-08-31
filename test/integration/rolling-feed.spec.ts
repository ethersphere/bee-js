import { Dates, Strings, System } from 'cafe-utility'
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

// A write's HTTP response returning is not a guarantee it's already retrievable elsewhere on
// the node (this varies by Bee build/environment) - wait for it rather than assume it.
async function waitUntil(predicate: () => Promise<boolean>): Promise<void> {
  await System.waitFor(predicate, { attempts: 30, waitMillis: Dates.seconds(1) })
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

  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Hello rolling feed')
})

test('uploadPayload mirrors into the next period', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Mirrored payload', { deferred: false })

  setPeriod(1001)
  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Mirrored payload')
})

test('downloadPayload falls back to the previous period when the current one is empty', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Last known payload', { deferred: false })

  // period 1001 got mirrored, period 1002 was never written at all
  setPeriod(1002)
  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Last known payload')
})

test('uploadReference / downloadReference roundtrip', async () => {
  const { writer, reader } = makeWriterAndReader()
  setPeriod(1000)

  const uploaded = await bee.data.upload(batch(), 'Referenced content')
  await writer.uploadReference(batch(), uploaded.reference, { deferred: false })

  await waitUntil(async () => (await reader.downloadReference()).reference.toHex() === uploaded.reference.toHex())
})

test('isCaughtUp is true for a written/mirrored period and false past a gap', async () => {
  const { writer } = makeWriterAndReader()
  setPeriod(1000)

  await writer.uploadPayload(batch(), 'Still going', { deferred: false })

  await waitUntil(async () => writer.isCaughtUp(1000))
  expect(await writer.isCaughtUp(1001)).toBe(true)
  expect(await writer.isCaughtUp(1005)).toBe(false)
})

test('catchUp backfills a gap without touching its target period', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Backfilled payload', { deferred: false })
  await waitUntil(async () => writer.isCaughtUp(1000))

  expect(await writer.isCaughtUp(1003)).toBe(false)
  await writer.catchUp(batch(), 1003)
  // catchUp never writes its own target (1003) - only the gap strictly before it
  await waitUntil(async () => writer.isCaughtUp(1002))
  expect(await writer.isCaughtUp(1003)).toBe(false)

  setPeriod(1003)
  // reader falls back one period, from the still-empty 1003 to the now-backfilled 1002
  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Backfilled payload')
})

test('heartbeat (periodic uploadPayload) plus catchUp recovers cleanly after silence', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(1000)
  await writer.uploadPayload(batch(), 'Heartbeat payload', { deferred: false })
  await waitUntil(async () => writer.isCaughtUp(1000))

  // two periods of silence: 1001 is mirrored, 1002 is a genuine gap, 1003 is where we resume
  setPeriod(1003)
  expect(await writer.isCaughtUp()).toBe(false)

  // per ROLLING_FEED.md: keeping the current period alive during silence is the caller's
  // job (a heartbeat republish), catchUp only backfills what's strictly before it (1002 here)
  await writer.uploadPayload(batch(), 'Heartbeat payload', { deferred: false })
  await writer.catchUp(batch())
  await waitUntil(async () => writer.isCaughtUp(1002))
  expect(await writer.isCaughtUp()).toBe(true)

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Heartbeat payload')
})

test('catchUp cannot clobber a concurrent write to its target period', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(0)
  await writer.uploadPayload(batch(), 'Old payload', { deferred: false })
  await waitUntil(async () => writer.isCaughtUp(0))
  // period 1 is mirrored from period 0; period 2 is a gap; the writer resumes at 3

  setPeriod(3)
  await writer.uploadPayload(batch(), 'Fresh payload', { deferred: false })
  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Fresh payload')

  // catching up to the very period that was just written with fresh data must not touch it,
  // regardless of call order - there's no way to safely check-then-write around a concurrent writer
  await writer.catchUp(batch(), 3)

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Fresh payload')
})

test('catchUp is not fooled by an older buried gap', async () => {
  const { writer, reader } = makeWriterAndReader()

  setPeriod(0)
  await writer.uploadPayload(batch(), 'Old payload', { deferred: false })
  await waitUntil(async () => writer.isCaughtUp(0))
  // period 2 is a deliberate buried gap: never written, never mirrored into

  setPeriod(3)
  await writer.uploadPayload(batch(), 'Recent payload', { deferred: false })
  await waitUntil(async () => writer.isCaughtUp(3))
  // populated so far: 0, 1, 3, 4 -- with a hole at 2

  expect(await writer.isCaughtUp(6)).toBe(false)
  await writer.catchUp(batch(), 6)
  // catchUp never writes period 6 itself - only fills the gap up to period 5
  await waitUntil(async () => writer.isCaughtUp(5))
  expect(await writer.isCaughtUp(6)).toBe(false)

  setPeriod(6)
  // reader falls back from the still-empty 6 to the now-backfilled 5; must be the recent
  // (period 4) content, not the one from before the buried gap
  await waitUntil(async () => (await reader.downloadPayload()).payload.toUtf8() === 'Recent payload')
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
