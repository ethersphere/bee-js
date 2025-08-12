import { createServer } from 'http'
import { Bee } from '../src'

let i = 12000

const responses = new Map<string, string>()

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
