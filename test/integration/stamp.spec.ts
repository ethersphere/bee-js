import { Dates, Objects, Strings, System } from 'cafe-utility'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('GET stamps', async () => {
  const stamps = await bee.getAllPostageBatch()
  expect(stamps.length).toBeGreaterThan(0)

  const stamp = await bee.getPostageBatch(stamps[0].batchID)
  expect(Objects.deepEquals(stamp, stamps[0])).toBeTruthy()

  const buckets = await bee.getPostageBatchBuckets(stamps[0].batchID)
  expect(buckets.buckets.length).toBeGreaterThan(0)
})

test('GET batches', async () => {
  const batches = await bee.getAllGlobalPostageBatch()
  expect(batches.length).toBeGreaterThan(0)
})

test('POST stamps', async () => {
  const response = await bee.createPostageBatch('500000000', 17, { waitForUsable: true })
  expect(response.toHex()).toHaveLength(64)

  await bee.topUpBatch(response, '500000000')

  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.getAllPendingTransactions()

      return pendingTransactions.length === 0
    },
    Dates.seconds(1),
    60,
  )

  await bee.diluteBatch(response, 18)

  await System.waitFor(
    async () => {
      const stamp = await bee.getPostageBatch(response)

      return stamp.depth === 18
    },
    Dates.seconds(1),
    120,
  )

  const stamp = await bee.getPostageBatch(response)
  expect(stamp.depth).toBe(18)
})

test('POST stamps rejections', async () => {
  await expect(bee.createPostageBatch('0', 17)).rejects.toThrow()
  await expect(bee.createPostageBatch('1', 17)).rejects.toThrow()
  await expect(bee.createPostageBatch('500000000', 16)).rejects.toThrow()
  await expect(bee.createPostageBatch('500000000', 256)).rejects.toThrow()
})

test('POST envelope', async () => {
  const data = Strings.randomAlphanumeric(40)
  const cac = makeContentAddressedChunk(data)

  const response = await bee.createEnvelope(batch(), cac.address)
  expect(response.issuer).toHaveLength(20)
  expect(response.index).toHaveLength(8)
  expect(response.signature).toHaveLength(65)
  expect(response.timestamp).toHaveLength(8)

  // TODO: envelope for SOC?
  await bee.uploadChunk(response, cac)
})
