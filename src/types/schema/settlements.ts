import { z } from 'zod'
import { BZZ } from '../../utils/tokens.js'
import { asNumberString } from '../../utils/type.js'

const SettlementSchema = z.object({
  peer: z.string(),
  sent: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'sent' }))),
  received: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'received' }))),
})

export const GetSettlementsResponse = SettlementSchema

export const GetAllSettlementsResponse = z.object({
  totalSent: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'totalSent' }))),
  totalReceived: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'totalReceived' }))),
  settlements: z.array(SettlementSchema),
})
