import { Dates, System } from 'cafe-utility'
import { BZZ } from '../../src'
import { makeBee } from '../utils'

const bee = makeBee()

test('GET/POST stake', async () => {
  const stakePreviously = await bee.getStake()

  const transactionId = await bee.depositStake(BZZ.fromFloat(10))
  expect(transactionId.toHex()).toHaveLength(64)

  await System.waitFor(
    async () => {
      const stake = await bee.getStake()

      return stake.eq(stakePreviously.plus(BZZ.fromFloat(10)))
    },
    { attempts: 180, waitMillis: Dates.seconds(1) },
  )
})
