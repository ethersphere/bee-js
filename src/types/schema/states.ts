import { z } from 'zod'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { TransactionId } from '../../utils/typed-bytes'
import { normalizeCurrentPrice } from '../../utils/workaround'

export const GetReserveStateResponse = z.object({
  commitment: z.number(),
  radius: z.number(),
  storageRadius: z.number(),
  reserveCapacityDoubling: z.number(),
})

export const GetChainStateResponse = z.object({
  block: z.number(),
  chainTip: z.number(),
  totalAmount: z.string().transform(s => asNumberString(s, { name: 'totalAmount' })),
  currentPrice: z
    .string()
    .transform(Number)
    .transform(s => normalizeCurrentPrice(s)),
  minimumValidityBlocks: z.number().optional(),
})

export const GetWalletBalanceResponse = z.object({
  bzzBalance: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'bzzBalance' }))),
  nativeTokenBalance: z.string().transform(s => DAI.fromWei(asNumberString(s, { name: 'nativeTokenBalance' }))),
  chainID: z.number(),
  chequebookContractAddress: z.string(),
  walletAddress: z.string(),
})

export const WithdrawResponse = z.object({
  transactionHash: z.string().transform(s => new TransactionId(s)),
})
