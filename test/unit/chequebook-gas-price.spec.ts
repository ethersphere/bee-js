import { createServer, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Bee, BZZ } from '../../src'

const transactionHash = 'ab'.repeat(32)

let server: Server
let bee: Bee
let lastHeaders: IncomingHttpHeaders

beforeAll(async () => {
  server = createServer((req, res) => {
    lastHeaders = req.headers
    res.writeHead(201, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ transactionHash }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

test('deposit sends the gas price, not the amount', async () => {
  await bee.chequebook.deposit('1000000', '3000000000')

  expect(lastHeaders['gas-price']).toBe('3000000000')
})

test('withdraw sends the gas price, not the amount', async () => {
  await bee.chequebook.withdraw('1000000', '3000000000')

  expect(lastHeaders['gas-price']).toBe('3000000000')
})

test('deposit with a BZZ amount sends the gas price', async () => {
  await bee.chequebook.deposit(BZZ.fromDecimalString('1'), 3000000000n)

  expect(lastHeaders['gas-price']).toBe('3000000000')
})

test('withdraw with a BZZ amount sends the gas price', async () => {
  await bee.chequebook.withdraw(BZZ.fromDecimalString('1'), 3000000000n)

  expect(lastHeaders['gas-price']).toBe('3000000000')
})

test('deposit without a gas price sends no gas price header', async () => {
  await bee.chequebook.deposit('1000000')

  expect(lastHeaders['gas-price']).toBeUndefined()
})
