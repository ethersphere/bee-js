import type { BeeRequestOptions, NumberString, WalletBalance } from '../types'
import { BZZ, DAI } from '../utils/tokens'
import { EthAddress, TransactionId } from '../utils/typed-bytes'
import * as api from '../api/wallet'
import type { BeeContext } from './context'

/**
 * Node wallet operations (balances and external withdrawals).
 *
 * Accessed as `bee.wallet`.
 */
export class Wallet {
  constructor(private readonly context: BeeContext) {}

  /**
   * Gets DAI and BZZ balances of the Bee node wallet.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getBalance(requestOptions?: BeeRequestOptions): Promise<WalletBalance> {
    return api.getWalletBalance(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Withdraws BZZ from the node wallet (not chequebook) to a whitelisted external wallet address.
   *
   * @param amount Amount of BZZ tokens to withdraw. If not providing a `BZZ` instance, the amount is denoted in PLUR.
   * @param address
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdrawBZZ(
    amount: BZZ | NumberString | string | bigint,
    address: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const bzz = amount instanceof BZZ ? amount : BZZ.fromPLUR(amount)
    const ethAddress = new EthAddress(address)

    return api.withdrawBZZ(this.context.getRequestOptionsForCall(requestOptions), bzz, ethAddress)
  }

  /**
   * Withdraws DAI from the node wallet (not chequebook) to a whitelisted external wallet address.
   *
   * @param amount Amount of DAI tokens to withdraw. If not providing a `DAI` instance, the amount is denoted in wei.
   * @param address
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async withdrawDAI(
    amount: DAI | NumberString | string | bigint,
    address: EthAddress | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<TransactionId> {
    const dai = amount instanceof DAI ? amount : DAI.fromWei(amount)
    const ethAddress = new EthAddress(address)

    return api.withdrawDAI(this.context.getRequestOptionsForCall(requestOptions), dai, ethAddress)
  }
}
