import { Types } from 'cafe-utility'
import type {
  BeeRequestOptions,
  CashoutResult,
  Cheque,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastCashoutActionResponse,
  LastChequesForPeerResponse,
  LastChequesResponse,
  NumberString,
  TransactionOptions,
} from '../../types'
import { prepareRequestHeaders } from '../../utils/headers'
import { http } from '../../utils/http'
import { BZZ } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { EthAddress, PeerAddress, TransactionId } from '../../utils/typed-bytes'

const chequebookEndpoint = 'chequebook'

/**
 * Get the address of the chequebook contract used
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookAddress(requestOptions: BeeRequestOptions): Promise<ChequebookAddressResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/address',
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    chequebookAddress: Types.asString(body.chequebookAddress, { name: 'chequebookAddress' }),
  }
}

/**
 * Get the balance of the chequebook
 *
 * @param requestOptions Options for making requests
 */
export async function getChequebookBalance(requestOptions: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/balance',
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    availableBalance: BZZ.fromPLUR(asNumberString(body.availableBalance, { name: 'availableBalance' })),
    totalBalance: BZZ.fromPLUR(asNumberString(body.totalBalance, { name: 'totalBalance' })),
  }
}

/**
 * Get last cashout action for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastCashoutAction(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastCashoutActionResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    peer: Types.asString(body.peer, { name: 'peer' }),
    uncashedAmount: BZZ.fromPLUR(asNumberString(body.uncashedAmount, { name: 'uncashedAmount' })),
    transactionHash: Types.asNullableString(body.transactionHash),
    lastCashedCheque: Types.asNullable(x => asCheque(x), body.lastCashedCheque),
    result: Types.asNullable(x => asCashoutResult(x), body.result),
  }
}

/**
 * Cashout the last cheque for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 * @param options
 */
export async function cashoutLastCheque(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
  options?: TransactionOptions,
): Promise<TransactionId> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + `/cashout/${peer}`,
    responseType: 'json',
    headers: prepareRequestHeaders(null, options),
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}

/**
 * Get last cheques for the peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getLastChequesForPeer(
  requestOptions: BeeRequestOptions,
  peer: PeerAddress,
): Promise<LastChequesForPeerResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + `/cheque/${peer}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    peer: Types.asString(body.peer, { name: 'peer' }),
    lastreceived: Types.asNullable(x => asCheque(x), body.lastreceived),
    lastsent: Types.asNullable(x => asCheque(x), body.lastsent),
  }
}

/**
 * Get last cheques for all peers
 *
 * @param requestOptions Options for making requests
 */
export async function getLastCheques(requestOptions: BeeRequestOptions): Promise<LastChequesResponse> {
  const response = await http<unknown>(requestOptions, {
    url: chequebookEndpoint + '/cheque',
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const lastcheques = Types.asArray(body.lastcheques, { name: 'lastcheques' }).map(x =>
    Types.asObject(x, { name: 'lastcheque' }),
  )

  return {
    lastcheques: lastcheques.map(x => ({
      peer: Types.asString(x.peer, { name: 'peer' }),
      lastreceived: Types.asNullable(y => asCheque(y), x.lastreceived),
      lastsent: Types.asNullable(y => asCheque(y), x.lastsent),
    })),
  }
}

function asCheque(x: unknown): Cheque {
  const object = Types.asObject(x, { name: 'cheque' })

  return {
    beneficiary: new EthAddress(Types.asString(object.beneficiary, { name: 'beneficiary' })),
    chequebook: new EthAddress(Types.asString(object.chequebook, { name: 'chequebook' })),
    payout: BZZ.fromPLUR(asNumberString(object.payout, { name: 'payout' })),
  }
}

function asCashoutResult(x: unknown): CashoutResult {
  const object = Types.asObject(x, { name: 'cashout result' })

  return {
    recipient: Types.asString(object.recipient, { name: 'recipient' }),
    lastPayout: BZZ.fromPLUR(asNumberString(object.lastPayout, { name: 'lastPayout' })),
    bounced: Types.asBoolean(object.bounced, { name: 'bounced' }),
  }
}

/**
 * Deposit tokens from overlay address into chequebook
 *
 * @param requestOptions Options for making requests
 * @param amount   Amount of tokens to deposit
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function depositTokens(
  requestOptions: BeeRequestOptions,
  amount: number | NumberString,
  gasPrice?: NumberString | string | bigint,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/deposit',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}

/**
 * Withdraw tokens from the chequebook to the overlay address
 *
 * @param requestOptions Options for making requests
 * @param amount   Amount of tokens to withdraw
 * @param gasPrice Gas Price in WEI for the transaction call
 * @return string  Hash of the transaction
 */
export async function withdrawTokens(
  requestOptions: BeeRequestOptions,
  amount: number | NumberString,
  gasPrice?: NumberString | string | bigint,
): Promise<TransactionId> {
  const headers: Record<string, string> = {}

  if (gasPrice) {
    headers['gas-price'] = gasPrice.toString()
  }

  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: chequebookEndpoint + '/withdraw',
    responseType: 'json',
    params: { amount: amount.toString(10) },
    headers,
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return new TransactionId(Types.asString(body.transactionHash, { name: 'transactionHash' }))
}
