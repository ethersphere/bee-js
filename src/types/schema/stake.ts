import { z } from 'zod'
import { BZZ, DAI } from '../../utils/tokens'
import { asNumberString } from '../../utils/type'
import { TransactionId } from '../../utils/typed-bytes'

export const GetStakeResponse = z.object({
  stakedAmount: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'stakedAmount' }))),
})

export const GetWithdrawableStakeResponse = z.object({
  withdrawableAmount: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'withdrawableAmount' }))),
})

export const TxHashResponse = z.object({
  txHash: z.string().transform(s => new TransactionId(s)),
})

export const GetRedistributionStateResponse = z.object({
  minimumGasFunds: z.string().transform(s => DAI.fromWei(asNumberString(s, { name: 'minimumGasFunds' }))),
  hasSufficientFunds: z.boolean(),
  isFrozen: z.boolean(),
  isFullySynced: z.boolean(),
  phase: z.string(),
  round: z.number(),
  lastWonRound: z.number(),
  lastPlayedRound: z.number(),
  lastFrozenRound: z.number(),
  lastSelectedRound: z.number(),
  lastSampleDurationSeconds: z.number(),
  block: z.number(),
  reward: z.string().transform(s => BZZ.fromPLUR(asNumberString(s, { name: 'reward' }))),
  fees: z.string().transform(s => DAI.fromWei(asNumberString(s, { name: 'fees' }))),
  isHealthy: z.boolean(),
})
