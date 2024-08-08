import axios from 'axios'
import { Types } from 'cafe-utility'
import { getAddressesShape } from './get-addresses'
import { getBalancesShape } from './get-balances'
import { getBatchesShape } from './get-batches'
import { getChainstateShape } from './get-chainstate'
import { getChequebookAddressShape } from './get-chequebook-address'
import { getChequebookBalanceShape } from './get-chequebook-balance'
import { getChequebookChequeShape } from './get-chequebook-cheque'
import { getHealthShape } from './get-health'
import { getNodeShape } from './get-node'
import { getPeersShape } from './get-peers'
import { getReadinessShape } from './get-readiness'
import { getRedistributionstateShape } from './get-redistributionstate'
import { getReservestateShape } from './get-reservestate'
import { getSettlementsShape } from './get-settlements'
import { getStakeShape } from './get-stake'
import { getStampsShape } from './get-stamps'
import { getStatusShape } from './get-status'
import { getTimesettlementsShape } from './get-timesettlements'
import { getTopologyShape } from './get-topology'
import { getWalletShape } from './get-wallet'
import { getWelcomeMessageShape } from './get-welcome-message'

test('GET /addresses', async () => {
  await testGet('http://localhost:1635/addresses', getAddressesShape)
  await testGet('http://localhost:1635/peers', getPeersShape)
  await testGet('http://localhost:1635/topology', getTopologyShape)
  await testGet('http://localhost:1635/welcome-message', getWelcomeMessageShape)
  await testGet('http://localhost:1635/balances', getBalancesShape)
  await testGet('http://localhost:1635/consumed', getBalancesShape)
  await testGet('http://localhost:1635/chequebook/address', getChequebookAddressShape)
  await testGet('http://localhost:1635/chequebook/balance', getChequebookBalanceShape)
  await testGet('http://localhost:1635/chequebook/cheque', getChequebookChequeShape)
  await testGet('http://localhost:1635/reservestate', getReservestateShape)
  await testGet('http://localhost:1635/chainstate', getChainstateShape)
  await testGet('http://localhost:1635/node', getNodeShape)
  await testGet('http://localhost:1635/health', getHealthShape)
  await testGet('http://localhost:1635/readiness', getReadinessShape)
  await testGet('http://localhost:1635/settlements', getSettlementsShape)
  await testGet('http://localhost:1635/timesettlements', getTimesettlementsShape)
  await testGet('http://localhost:1635/redistributionstate', getRedistributionstateShape)
  await testGet('http://localhost:1635/wallet', getWalletShape)
  await testGet('http://localhost:1635/stamps', getStampsShape)
  await testGet('http://localhost:1635/batches', getBatchesShape)
  await testGet('http://localhost:1635/stake', getStakeShape)
  await testGet('http://localhost:1635/status', getStatusShape)
})

async function testGet(url: string, shape: any) {
  const response = await axios.get(url)

  if (Array.isArray(response.data)) {
    Types.enforceArrayShape(response.data, shape)
  } else {
    Types.enforceObjectShape(response.data, shape)
  }
}
