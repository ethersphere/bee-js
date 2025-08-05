import { currentBeeMode, makeBee } from '../utils'

const bee = makeBee()

test('GET <empty>', async () => {
  expect(await bee.checkConnection())
  expect(await bee.isConnected()).toBe(true)
})

test('API compatibility', async () => {
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
  expect(info.beeMode).toBe(currentBeeMode())
  expect(info.chequebookEnabled).toBe(currentBeeMode() !== 'ultra-light')
  expect(info.swapEnabled).toBe(currentBeeMode() !== 'ultra-light')
})

test('GET chain state', async () => {
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const chainState = await bee.getChainState()
  expect(chainState.chainTip).toBeGreaterThanOrEqual(38226606)
  expect(chainState.block).toBeGreaterThanOrEqual(38226606)
  expect(parseInt(chainState.totalAmount)).not.toBeNaN()
  expect(chainState.currentPrice).not.toBeNaN()
})

test('GET redistribution state', async () => {
  if (currentBeeMode() !== 'full') {
    return
  }

  const redistributionState = await bee.getRedistributionState()
  expect(redistributionState).toBeTruthy()
})

test('GET reserve state', async () => {
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const reserveState = await bee.getReserveState()

  expect(reserveState.radius).toBeGreaterThan(0)
  expect(reserveState.commitment).toBeGreaterThan(0)

  if (currentBeeMode() === 'light') {
    expect(reserveState.storageRadius).toBe(0)
  } else {
    expect(reserveState.storageRadius).toBeGreaterThan(0)
  }
})

test('GET wallet', async () => {
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const wallet = await bee.getWalletBalance()
  expect(parseFloat(wallet.bzzBalance.toDecimalString())).toBeGreaterThan(20)
  expect(parseFloat(wallet.bzzBalance.toDecimalString())).toBeLessThan(10000)
  expect(parseFloat(wallet.nativeTokenBalance.toDecimalString())).toBeGreaterThan(0.9)
  expect(parseFloat(wallet.nativeTokenBalance.toDecimalString())).toBeLessThan(2)
})

test('GET status', async () => {
  const status = await bee.getStatus()
  expect(status).toBeTruthy()
  expect(status.beeMode).toBe('full')
  expect(status.isWarmingUp).toBe(false)
})

test('GET topology', async () => {
  const topology = await bee.getTopology()
  expect(topology.depth).toBeGreaterThan(0)
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
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const { balances } = await bee.getAllBalances()
  expect(balances.length).toBeGreaterThan(0)

  const balance = balances[0]
  const balanceResponse = await bee.getPeerBalance(balance.peer)
  expect(balanceResponse.peer).toBe(balance.peer)
  expect(balanceResponse.balance.toPLURString()).toBe(balance.balance.toPLURString())
})

test('GET consumed', async () => {
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const { balances } = await bee.getPastDueConsumptionBalances()
  expect(balances.length).toBeGreaterThan(0)

  const balance = balances[0]
  const balanceResponse = await bee.getPastDueConsumptionPeerBalance(balance.peer)
  expect(balanceResponse.peer).toBe(balance.peer)
  expect(balanceResponse.balance.toPLURString()).toBe(balance.balance.toPLURString())
})

test('GET settlements', async () => {
  if (currentBeeMode() === 'ultra-light') {
    return
  }

  const response = await bee.getAllSettlements()

  // TODO: light mode should also run this
  if (currentBeeMode() === 'full') {
    expect(response.settlements.length).toBeGreaterThan(0)

    const settlement = response.settlements[0]
    const settlementResponse = await bee.getSettlements(settlement.peer)
    expect(settlementResponse.peer).toBe(settlement.peer)
    expect(settlementResponse.sent.toPLURBigInt()).toBe(settlement.sent.toPLURBigInt())
    expect(settlementResponse.received.toPLURBigInt()).toBe(settlement.received.toPLURBigInt())
  }
})
