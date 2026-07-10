import type { BeeRequestOptions, ChequebookAddressResponse, ChequebookBalanceResponse, NumberString } from '../types'
import { BZZ } from '../utils/tokens'
import { asNumberString } from '../utils/type'
import { TransactionId } from '../utils/typed-bytes'
import * as api from '../api/chequebook'
import type { BeeContext } from './context'

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
    return api.getChequebookAddress(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the balance of the chequebook.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBalance(requestOptions?: BeeRequestOptions): Promise<ChequebookBalanceResponse> {
    return api.getChequebookBalance(this.context.getRequestOptionsForCall(requestOptions))
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

    const gasPriceString = gasPrice ? asNumberString(amount, { min: 0n, name: 'gasPrice' }) : undefined

    return api.depositTokens(this.context.getRequestOptionsForCall(requestOptions), amountString, gasPriceString)
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

    const gasPriceString = gasPrice ? asNumberString(amount, { min: 0n, name: 'gasPrice' }) : undefined

    return api.withdrawTokens(this.context.getRequestOptionsForCall(requestOptions), amountString, gasPriceString)
  }
}
