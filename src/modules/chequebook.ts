import type { BeeRequestOptions, ChequebookAddressResponse, ChequebookBalanceResponse, NumberString } from '../types'
import {
  GetChequebookAddressResponse,
  GetChequebookBalanceResponse,
  TransactionHashResponse,
} from '../types/schema/chequebook'
import { http } from '../utils/http'
import { BZZ } from '../utils/tokens'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const chequebookEndpoint = 'chequebook'

/**
 * Chequebook contract operations (address, balance, deposit, withdraw).
 *
 * Accessed as `bee.chequebook`.
 */
export class Chequebook {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets the address of the deployed chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAddress(requestOptions?: BeeRequestOptions): Promise<ChequebookAddressResponse> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${chequebookEndpoint}/address`,
      responseType: 'json',
    })

    return GetChequebookAddressResponse.parse(response.data)
  }

  /**
   * Gets the balance of the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBalance(requestOptions?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${chequebookEndpoint}/balance`,
      responseType: 'json',
    })

    return GetChequebookBalanceResponse.parse(response.data)
  }

  /**
   * Deposits tokens from the node wallet into the chequebook.
   *
   * @param amount Amount of BZZ tokens to deposit. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param gasPrice Gas Price in WEI for the transaction call
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async deposit(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    const headers: Record<string, string> = {}

    if (gasPrice) {
      headers['gas-price'] = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${chequebookEndpoint}/deposit`,
      responseType: 'json',
      params: { amount: amountString },
      headers,
    })

    return TransactionHashResponse.parse(response.data).transactionHash
  }

  /**
   * Withdraws tokens from the chequebook to the node wallet.
   *
   * @param amount Amount of BZZ tokens to withdraw. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param gasPrice Gas Price in WEI for the transaction call.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdraw(
    amount: BZZ | NumberString | string | bigint,
    gasPrice?: NumberString | string | bigint,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const amountString =
      amount instanceof BZZ ? amount.toPLURString() : asNumberString(amount, { min: 1n, name: 'amount' })

    const headers: Record<string, string> = {}

    if (gasPrice) {
      headers['gas-price'] = asNumberString(amount, { min: 0n, name: 'gasPrice' })
    }

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${chequebookEndpoint}/withdraw`,
      responseType: 'json',
      params: { amount: amountString },
      headers,
    })

    return TransactionHashResponse.parse(response.data).transactionHash
  }
}
