import { createServer } from 'http'
import { Bee } from '../src'

let i = 11633

const responses = new Map<string, string>()

responses.set(
  'GET /chainstate',
  JSON.stringify({ chainTip: 38679237, block: 38679230, totalAmount: '183499080648', currentPrice: '26558' }),
)

responses.set(
  'GET /stamps/f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
  JSON.stringify({
    batchID: 'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
    utilization: 46,
    usable: true,
    label: '',
    depth: 23,
    amount: '85844033282',
    bucketDepth: 16,
    blockNumber: 37496330,
    immutableFlag: true,
    exists: true,
    batchTTL: 2722136,
  }),
)

responses.set(
  'POST /stamps/458922240/22',
  JSON.stringify({ batchID: 'b330000000000000000000000000000000000000000000000000000000000000' }),
)

responses.set(
  'GET /stamps/b330000000000000000000000000000000000000000000000000000000000000',
  JSON.stringify({
    batchID: 'b330000000000000000000000000000000000000000000000000000000000000',
    utilization: 0,
    usable: true,
    label: '',
    depth: 22,
    amount: '458922240',
    bucketDepth: 16,
    blockNumber: 37496330,
    immutableFlag: true,
    exists: true,
    batchTTL: 86400,
  }),
)

responses.set(
  'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/458922240',
  JSON.stringify({
    batchID: 'b330000000000000000000000000000000000000000000000000000000000000',
  }),
)

responses.set(
  'PATCH /stamps/topup/b330000000000000000000000000000000000000000000000000000000000000/917844480',
  JSON.stringify({
    batchID: 'b330000000000000000000000000000000000000000000000000000000000000',
  }),
)

responses.set(
  'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/23',
  JSON.stringify({
    batchID: 'b330000000000000000000000000000000000000000000000000000000000000',
  }),
)

responses.set(
  'PATCH /stamps/dilute/b330000000000000000000000000000000000000000000000000000000000000/24',
  JSON.stringify({
    batchID: 'b330000000000000000000000000000000000000000000000000000000000000',
  }),
)

responses.set(
  'POST /bzz?name=filename.txt',
  JSON.stringify({
    reference: 'f8b2ad296d64824a8fe51a33ff15fe8668df13a20ad3d4eea4bb97ca600029aa',
  }),
)

interface MockedCall {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
}

export async function mocked(runnable: (bee: Bee) => Promise<void>): Promise<MockedCall[]> {
  const calls: MockedCall[] = []
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      const identifier = (req.method || 'GET') + ' ' + (req.url || '/')
      calls.push({ method: req.method || 'GET', url: req.url || '/', headers: req.headers })
      const response = responses.get(identifier)
      if (!response) {
        res.end('Not found - ' + identifier)
      }
      res.end(response)
    })
    const port = i++
    server.listen(port, async () => {
      try {
        await runnable(new Bee(`http://localhost:${port}`))
      } finally {
        server.close(() => {
          resolve(calls)
        })
      }
    })
  })
}
