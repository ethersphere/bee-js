import { TransactionId } from 'swarm-core'
import { z } from 'zod'
import { asNumberString } from '../../utils/type'

const TransactionInfoSchema = z.object({
  transactionHash: z.string().transform(s => new TransactionId(s)),
  to: z.string(),
  nonce: z.number(),
  gasPrice: z.string().transform(s => asNumberString(s, { name: 'gasPrice' })),
  gasLimit: z.number(),
  data: z.string(),
  created: z.string(),
  description: z.string(),
  value: z.string().transform(s => asNumberString(s, { name: 'value' })),
})

export const GetAllTransactionsResponse = z.object({
  pendingTransactions: z.array(TransactionInfoSchema),
})

export const GetTransactionResponse = TransactionInfoSchema

export const TransactionHashResponse = z.object({
  transactionHash: z.string().transform(s => new TransactionId(s)),
})
