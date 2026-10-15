import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Bee, BZZ } from '../../src'

let server: Server
let bee: Bee
let stakeBody: Record<string, unknown>

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(stakeBody))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

test('getMinimumDeposit returns the minimum reported by Bee', async () => {
  stakeBody = { stakedAmount: '400000000000000000', minimumDeposit: '100000000000000000' }

  const minimum = await bee.stake.getMinimumDeposit()

  expect(minimum).toBeInstanceOf(BZZ)
  expect(minimum?.toPLURString()).toBe('100000000000000000')
})

test('getMinimumDeposit returns null when the price oracle is unavailable', async () => {
  stakeBody = { stakedAmount: '400000000000000000', minimumDeposit: null }

  expect(await bee.stake.getMinimumDeposit()).toBeNull()
})

test('getMinimumDeposit returns null when Bee omits the field', async () => {
  stakeBody = { stakedAmount: '400000000000000000' }

  expect(await bee.stake.getMinimumDeposit()).toBeNull()
})

test('get still returns the staked amount', async () => {
  stakeBody = { stakedAmount: '400000000000000000', minimumDeposit: '1' }

  const staked = await bee.stake.get()

  expect(staked.toPLURString()).toBe('400000000000000000')
})
