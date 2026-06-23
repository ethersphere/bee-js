import { z } from 'zod'
import { BZZ } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { EthAddress, TransactionId } from '../../utils/typed-bytes'

const ChequeSchema = z.object({
  beneficiary: z.string().transform(s => new EthAddress(s)),
  chequebook: z.string().transform(s => new EthAddress(s)),
  payout: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'payout' }))),
})

const CashoutResultSchema = z.object({
  recipient: z.string(),
  lastPayout: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'lastPayout' }))),
  bounced: z.boolean(),
})

export const GetChequebookAddressResponse = z.object({
  chequebookAddress: z.string().transform(s => new EthAddress(s)),
})

export const GetChequebookBalanceResponse = z.object({
  availableBalance: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'availableBalance' }))),
  totalBalance: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'totalBalance' }))),
})

export const GetLastCashoutActionResponse = z.object({
  peer: z.string(),
  uncashedAmount: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'uncashedAmount' }))),
  transactionHash: z
    .string()
    .nullish()
    .transform(v => v ?? null),
  lastCashedCheque: ChequeSchema.nullish().transform(v => v ?? null),
  result: CashoutResultSchema.nullish().transform(v => v ?? null),
})

export const GetLastChequesForPeerResponse = z.object({
  peer: z.string(),
  lastreceived: ChequeSchema.nullish().transform(v => v ?? null),
  lastsent: ChequeSchema.nullish().transform(v => v ?? null),
})

export const GetLastChequesResponse = z.object({
  lastcheques: z.array(
    z.object({
      peer: z.string(),
      lastreceived: ChequeSchema.nullish().transform(v => v ?? null),
      lastsent: ChequeSchema.nullish().transform(v => v ?? null),
    }),
  ),
})

export const TransactionHashResponse = z.object({
  transactionHash: z.string().transform(s => new TransactionId(s)),
})
