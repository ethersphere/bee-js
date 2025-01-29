import { Types } from 'cafe-utility'
import type { BalanceResponse, BeeRequestOptions, PeerBalance } from '../../types'
import { http } from '../../utils/http'
import { asNumberString } from '../../utils/type'
import { PeerAddress } from '../../utils/typed-bytes'

const balancesEndpoint = 'balances'
const consumedEndpoint = 'consumed'

/**
 * Get the balances with all known peers including prepaid services
 *
 * @param requestOptions Options for making requests
 */
export async function getAllBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: balancesEndpoint,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const balances = Types.asArray(body.balances, { name: 'balances' }).map(x => Types.asObject(x, { name: 'balance' }))

  return {
    balances: balances.map(x => ({
      peer: Types.asString(x.peer, { name: 'peer' }),
      balance: asNumberString(x.balance, { name: 'balance' }),
    })),
  }
}

/**
 * Get the balances with a specific peer including prepaid services
 *
 * @param requestOptions Options for making requests
 * @param address Swarm address of peer
 */
export async function getPeerBalance(requestOptions: BeeRequestOptions, address: PeerAddress): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${balancesEndpoint}/${address}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    peer: Types.asString(body.peer, { name: 'peer' }),
    balance: asNumberString(body.balance, { name: 'balance' }),
  }
}

/**
 * Get the past due consumption balances with all known peers
 *
 * @param requestOptions Options for making requests
 */
export async function getPastDueConsumptionBalances(requestOptions: BeeRequestOptions): Promise<BalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: consumedEndpoint,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const balances = Types.asArray(body.balances, { name: 'balances' }).map(x => Types.asObject(x, { name: 'balance' }))

  return {
    balances: balances.map(x => ({
      peer: Types.asString(x.peer, { name: 'peer' }),
      balance: asNumberString(x.balance, { name: 'balance' }),
    })),
  }
}

/**
 * Get the past due consumption balance with a specific peer
 *
 * @param requestOptions Options for making requests
 * @param address Swarm address of peer
 */
export async function getPastDueConsumptionPeerBalance(
  requestOptions: BeeRequestOptions,
  address: PeerAddress,
): Promise<PeerBalance> {
  const response = await http<unknown>(requestOptions, {
    url: `${consumedEndpoint}/${address}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    peer: Types.asString(body.peer, { name: 'peer' }),
    balance: asNumberString(body.balance, { name: 'balance' }),
  }
}
