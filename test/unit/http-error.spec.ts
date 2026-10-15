import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Bee, BeeResponseError } from '../../src'

const reference = '00'.repeat(32)

let server: Server
let bee: Bee
let reply: { status: number; body: string; contentType?: string }

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(reply.status, { 'content-type': reply.contentType ?? 'application/json' })
    res.end(reply.body)
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

async function catchError(fn: () => Promise<unknown>): Promise<BeeResponseError> {
  try {
    await fn()
  } catch (error) {
    return error as BeeResponseError
  }
  throw Error('Expected the request to fail')
}

const notFound = JSON.stringify({ code: 404, message: 'not found' })
const readChunkFailed = JSON.stringify({ code: 500, message: 'read chunk failed' })

test('arraybuffer endpoint reports the JSON error body in the message', async () => {
  reply = { status: 404, body: notFound }

  const error = await catchError(async () => bee.data.download(reference))

  expect(error.message).toBe(`Not Found: ${notFound}`)
})

test('chunk endpoint reports the JSON error body in the message', async () => {
  reply = { status: 500, body: readChunkFailed }

  const error = await catchError(async () => bee.chunk.download(reference))

  expect(error.message).toBe(`Internal Server Error: ${readChunkFailed}`)
})

test('stream endpoint reports the JSON error body in the message', async () => {
  reply = { status: 404, body: notFound }

  const error = await catchError(async () => bee.data.downloadReadable(reference))

  expect(error.message).toBe(`Not Found: ${notFound}`)
})

test('arraybuffer endpoint exposes the parsed error body', async () => {
  reply = { status: 404, body: notFound }

  const error = await catchError(async () => bee.data.download(reference))

  expect(error.responseBody).toEqual({ code: 404, message: 'not found' })
  expect(error.response.data).toEqual({ code: 404, message: 'not found' })
})

test('arraybuffer endpoint reports a plain text error body as is', async () => {
  reply = { status: 500, body: 'read chunk failed', contentType: 'text/plain' }

  const error = await catchError(async () => bee.chunk.download(reference))

  expect(error.message).toBe('Internal Server Error: read chunk failed')
  expect(error.responseBody).toBe('read chunk failed')
})

test('arraybuffer endpoint falls back to the status text for an empty body', async () => {
  reply = { status: 500, body: '' }

  const error = await catchError(async () => bee.chunk.download(reference))

  expect(error.message).toBe('Internal Server Error')
})

test('json endpoint falls back to the status text for an empty body', async () => {
  reply = { status: 500, body: '' }

  const error = await catchError(async () => bee.stamp.get(reference))

  expect(error.message).toBe('Internal Server Error')
})

test('json endpoint reports the JSON error body in the message', async () => {
  reply = { status: 500, body: readChunkFailed }

  const error = await catchError(async () => bee.stamp.get(reference))

  expect(error.message).toBe(`Internal Server Error: ${readChunkFailed}`)
  expect(error.status).toBe(500)
})

test('error name is BeeResponseError', async () => {
  reply = { status: 404, body: notFound }

  const error = await catchError(async () => bee.data.download(reference))

  expect(error).toBeInstanceOf(BeeResponseError)
  expect(error.name).toBe('BeeResponseError')
})
