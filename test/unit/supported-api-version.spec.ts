import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Bee } from '../../src'
import { SUPPORTED_API_VERSION } from '../../src/version'

let server: Server
let bee: Bee
let apiVersion: string

const supportedMajor = Number(SUPPORTED_API_VERSION.split('.')[0])

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ apiVersion, version: '2.8.3', status: 'ok' }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

test('accepts a node with the same major API version but different minor and patch', async () => {
  apiVersion = `${supportedMajor}.99.42`

  expect(await bee.status.isSupportedApiVersion()).toBe(true)
})

test('accepts a prerelease of the same major API version', async () => {
  apiVersion = `${supportedMajor}.0.0-rc1`

  expect(await bee.status.isSupportedApiVersion()).toBe(true)
})

test('rejects a node with a different major API version', async () => {
  apiVersion = `${supportedMajor + 1}.0.0`

  expect(await bee.status.isSupportedApiVersion()).toBe(false)
})

test('rejects a malformed API version', async () => {
  apiVersion = 'not-a-version'

  expect(await bee.status.isSupportedApiVersion()).toBe(false)
})
