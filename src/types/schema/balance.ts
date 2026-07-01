import { z } from 'zod'
import { BZZ } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'

const PeerBalanceSchema = z.object({
  peer: z.string(),
  balance: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'balance' }))),
})

export const GetAllBalancesResponse = z.object({
  balances: z.array(PeerBalanceSchema),
})

export const GetPeerBalanceResponse = PeerBalanceSchema
