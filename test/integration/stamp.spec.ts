import { Dates, Objects, Strings, System } from 'cafe-utility'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('GET stamps', async () => {
  const stamps = await bee.stamp.getAll()
  expect(stamps.length).toBeGreaterThan(0)

  const stamp = await bee.stamp.get(stamps[0].batchID)
  expect(Objects.deepEquals(stamp, stamps[0])).toBeTruthy()

  const buckets = await bee.stamp.getBuckets(stamps[0].batchID)
  expect(buckets.buckets.length).toBeGreaterThan(0)
})

test('GET batches', async () => {
  const batches = await bee.stamp.getAllGlobal()
  expect(batches.length).toBeGreaterThan(0)
})

test('GET batch', async () => {
  const batches = await bee.stamp.getAllGlobal()
  expect(batches.length).toBeGreaterThan(0)

  const batch = await bee.stamp.getGlobal(batches[0].batchID)
  expect(Objects.deepEquals(batch, batches[0])).toBeTruthy()
})

test('POST stamps', async () => {
  const response = await bee.stamp.create('1098006401', 17, { waitForUsable: true })
  expect(response.toHex()).toHaveLength(64)

  await bee.stamp.topUp(response, '1098006401')

  await System.waitFor(
    async () => {
      const pendingTransactions = await bee.transaction.getAll()

      return pendingTransactions.length === 0
    },
    { attempts: 60, waitMillis: Dates.seconds(1), requiredConsecutivePasses: 3 },
  )

  await bee.stamp.dilute(response, 18)

  await System.waitFor(
    async () => {
      const stamp = await bee.stamp.get(response)

      return stamp.depth === 18
    },
    { attempts: 180, waitMillis: Dates.seconds(1) },
  )

  const stamp = await bee.stamp.get(response)
  expect(stamp.depth).toBe(18)
})

test('POST stamps rejections', async () => {
  await expect(bee.stamp.create('0', 17)).rejects.toThrow()
  await expect(bee.stamp.create('1', 17)).rejects.toThrow()
  await expect(bee.stamp.create('500000000', 16)).rejects.toThrow()
  await expect(bee.stamp.create('500000000', 256)).rejects.toThrow()
})

test('PATCH stamp label (updatePostageBatchLabel)', async () => {
  const response = await bee.stamp.create('1098006401', 17, { waitForUsable: true })
  expect(response.toHex()).toHaveLength(64)

  const label = 'test-label'
  await expect(bee.stamp.updateLabel(response, label)).resolves.not.toThrow()
  await expect(bee.stamp.get(response)).resolves.toMatchObject({ label })
})

test('PATCH stamp label (renameStorage)', async () => {
  const response = await bee.stamp.create('1098006401', 17, { waitForUsable: true })
  expect(response.toHex()).toHaveLength(64)

  const label = 'test-label'
  await expect(bee.storage.rename(response, label)).resolves.not.toThrow()
  await expect(bee.stamp.get(response)).resolves.toMatchObject({ label })
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
  await bee.chunk.upload(response, cac)
})
