import { AddressInfo } from 'node:net'
import { Bytes } from '@ethersphere/core-sdk'
import { WebSocketServer } from 'ws'
import { Bee, GsocMessageHandler, NULL_IDENTIFIER, NULL_OWNER } from '../../src'

let server: WebSocketServer
let bee: Bee
let lastUrl: URL

beforeAll(async () => {
  server = new WebSocketServer({ port: 0, host: '127.0.0.1' })
  server.on('connection', (socket, req) => {
    lastUrl = new URL(req.url ?? '', 'http://localhost')
    socket.send(Buffer.from('frame'))
  })
  await new Promise<void>(resolve => server.on('listening', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

async function subscribeOnce(options?: Parameters<Bee['messaging']['gsocSubscribe']>[3]): Promise<Bytes> {
  return new Promise((resolve, reject) => {
    const handler: GsocMessageHandler = {
      onMessage: (message, subscription) => {
        subscription.cancel()
        resolve(message)
      },
      onError: error => reject(error),
      onClose: () => undefined,
    }
    bee.messaging.gsocSubscribe(NULL_OWNER, NULL_IDENTIFIER, handler, options)
  })
}

test('gsocSubscribe sends no extra query parameters by default', async () => {
  const message = await subscribeOnce()

  expect(message.toUtf8()).toBe('frame')
  expect(lastUrl.searchParams.has('swarm-soc-fields')).toBe(false)
  expect(lastUrl.searchParams.has('swarm-cache-wrapped-chunk')).toBe(false)
})

test('gsocSubscribe requests the selected SOC fields in order', async () => {
  await subscribeOnce({ fields: ['identifier', 'signature', 'payload'] })

  expect(lastUrl.searchParams.get('swarm-soc-fields')).toBe('identifier,signature,payload')
})

test('gsocSubscribe requests caching the wrapped chunk', async () => {
  await subscribeOnce({ cacheWrappedChunk: true })

  expect(lastUrl.searchParams.get('swarm-cache-wrapped-chunk')).toBe('true')
})

test('gsocSubscribe rejects an unknown SOC field', () => {
  const handler: GsocMessageHandler = { onMessage: () => undefined, onError: () => undefined, onClose: () => undefined }

  expect(() =>
    bee.messaging.gsocSubscribe(NULL_OWNER, NULL_IDENTIFIER, handler, { fields: ['owner' as never] }),
  ).toThrow()
})
