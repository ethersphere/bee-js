import type { BeeRequestOptions, NumberString, WalletBalance } from '../types'
import { GetWalletBalanceResponse, WithdrawResponse } from '../types/schema/states'
import { http } from '../utils/http'
import { BZZ, DAI } from '../utils/tokens'
import { EthAddress, TransactionId } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const WALLET_ENDPOINT = 'wallet'

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
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: WALLET_ENDPOINT,
      responseType: 'json',
    })

    return GetWalletBalanceResponse.parse(response.data)
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${WALLET_ENDPOINT}/withdraw/bzz`,
      responseType: 'json',
      params: { amount: bzz.toPLURString(), address: ethAddress.toHex() },
    })

    return WithdrawResponse.parse(response.data).transactionHash
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${WALLET_ENDPOINT}/withdraw/nativetoken`,
      responseType: 'json',
      params: { amount: dai.toWeiString(), address: ethAddress.toHex() },
    })

    return WithdrawResponse.parse(response.data).transactionHash
  }
}
