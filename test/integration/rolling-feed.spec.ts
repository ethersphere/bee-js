import { Strings, System } from 'cafe-utility'
import { PrivateKey, Topic } from '@ethersphere/core-sdk'
import { batch, makeBee } from '../utils'

const bee = makeBee()

const PERIOD_LENGTH = 3 // seconds

function currentPeriod(): number {
  return Math.floor(Date.now() / 1000 / PERIOD_LENGTH)
}

async function waitForPeriod(target: number): Promise<void> {
  while (currentPeriod() < target) {
    await System.sleepMillis(150)
  }
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

  await writer.uploadPayload(batch(), 'Hello rolling feed', { deferred: false })

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Hello rolling feed')
})

test('uploadPayload mirrors into the next period', async () => {
  const { writer, reader } = makeWriterAndReader()
  const startPeriod = currentPeriod()

  await writer.uploadPayload(batch(), 'Mirrored payload', { deferred: false })
  await waitForPeriod(startPeriod + 1)

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Mirrored payload')
})

test('downloadPayload falls back to the previous period when the current one is empty', async () => {
  const { writer, reader } = makeWriterAndReader()

  await writer.uploadPayload(batch(), 'Last known payload', { deferred: false })

  // wait for the one-period-empty gap (current unpopulated, previous populated); if a slow
  // call overshoots past it, re-seed from wherever we land instead of racing a fixed wait
  for (;;) {
    const period = currentPeriod()
    const previousPopulated = await writer.isCaughtUp(period - 1)
    const currentPopulated = await writer.isCaughtUp(period)

    if (previousPopulated && !currentPopulated) {
      break
    }

    if (!previousPopulated) {
      await writer.uploadPayload(batch(), 'Last known payload', { deferred: false })
    }

    await System.sleepMillis(150)
  }

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Last known payload')
})

test('uploadReference / downloadReference roundtrip', async () => {
  const { writer, reader } = makeWriterAndReader()

  const uploaded = await bee.data.upload(batch(), 'Referenced content')
  await writer.uploadReference(batch(), uploaded.reference, { deferred: false })

  const result = await reader.downloadReference()
  expect(result.reference.toHex()).toBe(uploaded.reference.toHex())
})

test('isCaughtUp is true for a written/mirrored period and false past a gap', async () => {
  const { writer } = makeWriterAndReader()
  const startPeriod = currentPeriod()

  await writer.uploadPayload(batch(), 'Still going', { deferred: false })

  expect(await writer.isCaughtUp(startPeriod)).toBe(true)
  expect(await writer.isCaughtUp(startPeriod + 1)).toBe(true)
  expect(await writer.isCaughtUp(startPeriod + 5)).toBe(false)
})

test('catchUp backfills a gap so the reader resolves it again', async () => {
  const { writer, reader } = makeWriterAndReader()
  const startPeriod = currentPeriod()
  const gapPeriod = startPeriod + 2

  await writer.uploadPayload(batch(), 'Backfilled payload', { deferred: false })
  expect(await writer.isCaughtUp(gapPeriod)).toBe(false)

  await writer.catchUp(batch(), gapPeriod)
  expect(await writer.isCaughtUp(gapPeriod)).toBe(true)

  // the calls above take real time; keep the backfill current with whatever period
  // we actually land on before reading it back
  for (let period = currentPeriod(); !(await writer.isCaughtUp(period)); period = currentPeriod()) {
    await writer.catchUp(batch(), period)
  }

  const result = await reader.downloadPayload()
  expect(result.payload.toUtf8()).toBe('Backfilled payload')
})
