import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Bee } from '../../src'

const state = {
  minimumGasFunds: '11080889201250000',
  hasSufficientFunds: true,
  isFrozen: false,
  isFullySynced: true,
  phase: 'commit',
  round: 233,
  lastWonRound: 0,
  lastPlayedRound: 232,
  lastFrozenRound: 0,
  lastSelectedRound: 232,
  lastSampleDurationSeconds: 17.4,
  block: 48430674,
  reward: '0',
  fees: '0',
  isHealthy: true,
  enabled: false,
  hasCommittedThisRound: true,
  hasRevealedThisRound: false,
}

let server: Server
let bee: Bee
let lastRequest: { method?: string; url?: string; contentType?: string; body: string }

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      lastRequest = { method: req.method, url: req.url, contentType: req.headers['content-type'], body }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(req.method === 'PATCH' ? { enabled: JSON.parse(body).enabled } : state))
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

test('getRedistributionState returns the participation fields', async () => {
  const result = await bee.stake.getRedistributionState()

  expect(result.enabled).toBe(false)
  expect(result.hasCommittedThisRound).toBe(true)
  expect(result.hasRevealedThisRound).toBe(false)
})

test('setRedistributionEnabled sends a PATCH with the flag', async () => {
  const enabled = await bee.stake.setRedistributionEnabled(false)

  expect(lastRequest.method).toBe('PATCH')
  expect(lastRequest.url).toBe('/redistributionstate')
  expect(lastRequest.contentType).toBe('application/json')
  expect(JSON.parse(lastRequest.body)).toEqual({ enabled: false })
  expect(enabled).toBe(false)
})

test('setRedistributionEnabled can re-enable participation', async () => {
  const enabled = await bee.stake.setRedistributionEnabled(true)

  expect(JSON.parse(lastRequest.body)).toEqual({ enabled: true })
  expect(enabled).toBe(true)
})

test('setRedistributionEnabled rejects a non-boolean flag', async () => {
  await expect(bee.stake.setRedistributionEnabled('false' as unknown as boolean)).rejects.toThrow()
})
