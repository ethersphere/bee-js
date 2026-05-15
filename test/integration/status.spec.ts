import { makeBee } from '../utils'

const bee = makeBee()

test('GET <empty>', async () => {
  expect(await bee.checkConnection())
  expect(await bee.isConnected()).toBe(true)
})

test.skip('API compatibility', async () => {
  expect(await bee.isSupportedApiVersion()).toBe(true)
  expect(await bee.isSupportedExactVersion()).toBe(true)
})

test('GET health, readiness and info', async () => {
  const health = await bee.getHealth()
  const readiness = await bee.getReadiness()
  const info = await bee.getNodeInfo()
  expect(health.apiVersion).toBe(readiness.apiVersion)
  expect(health.version).toBe(readiness.version)
  expect(health.status).toBe('ok')
  expect(readiness.status).toBe('ready')
  expect(info.beeMode).toBe('full')
  expect(info.chequebookEnabled).toBe(true)
  expect(info.swapEnabled).toBe(true)
})

test('GET chain state', async () => {
  const chainState = await bee.getChainState()
  expect(chainState.chainTip).toBeGreaterThan(300)
  expect(chainState.block).toBeGreaterThan(300)
  expect(parseInt(chainState.totalAmount)).not.toBeNaN()
  expect(chainState.currentPrice).toBe(24000)
})

test('GET redistribution state', async () => {
  const redistributionState = await bee.getRedistributionState()
  expect(redistributionState).toBeTruthy()
})

test('GET reserve state', async () => {
  const reserveState = await bee.getReserveState()

  expect(reserveState.radius).toBeGreaterThanOrEqual(0)
  expect(reserveState.commitment).toBeGreaterThan(0)
  expect(reserveState.reserveCapacityDoubling).toBe(0)
  expect(reserveState.storageRadius).toBeGreaterThanOrEqual(0)
})

test('GET wallet', async () => {
  const wallet = await bee.getWalletBalance()
  expect(parseFloat(wallet.bzzBalance.toDecimalString())).toBeGreaterThan(0)
  expect(parseFloat(wallet.nativeTokenBalance.toDecimalString())).toBeGreaterThan(0)
})

test('GET status', async () => {
  const status = await bee.getStatus()
  expect(status).toBeTruthy()
  expect(status.beeMode).toBe('full')
  expect(status.isWarmingUp).toBe(false)
})

test('GET topology', async () => {
  const topology = await bee.getTopology()
  expect(topology.depth).toBeGreaterThanOrEqual(0)
  expect(topology.population).toBeGreaterThan(0)
  expect(topology.connected).toBeGreaterThan(0)
})

test('GET addresses', async () => {
  const addresses = await bee.getNodeAddresses()
  expect(addresses).toBeTruthy()
})

test('GET peers', async () => {
  const peers = await bee.getPeers()
  expect(peers).toBeTruthy()
})

test('GET balances', async () => {
  const { balances } = await bee.getAllBalances()
  expect(balances.length).toBeGreaterThan(0)

  const balance = balances[0]
  const balanceResponse = await bee.getPeerBalance(balance.peer)
  expect(balanceResponse.peer).toBe(balance.peer)
  expect(balanceResponse.balance.toPLURString()).toBe(balance.balance.toPLURString())
})

test('GET consumed', async () => {
  const { balances } = await bee.getPastDueConsumptionBalances()
  expect(balances.length).toBeGreaterThan(0)

  const balance = balances[0]
  const balanceResponse = await bee.getPastDueConsumptionPeerBalance(balance.peer)
  expect(balanceResponse.peer).toBe(balance.peer)
  expect(balanceResponse.balance.toPLURString()).toBe(balance.balance.toPLURString())
})

test('GET settlements', async () => {
  const response = await bee.getAllSettlements()

  expect(response.settlements.length).toBeGreaterThan(0)

  const settlement = response.settlements[0]
  const settlementResponse = await bee.getSettlements(settlement.peer)
  expect(settlementResponse.peer).toBe(settlement.peer)
  expect(settlementResponse.sent.toPLURBigInt()).toBe(settlement.sent.toPLURBigInt())
  expect(settlementResponse.received.toPLURBigInt()).toBe(settlement.received.toPLURBigInt())
})
