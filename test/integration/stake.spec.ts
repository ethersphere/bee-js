import { Dates, System } from 'cafe-utility'
import { BZZ } from '../../src'
import { currentBeeMode, makeBee } from '../utils'

const bee = makeBee()

test('GET stake', async () => {
  const stake = await bee.getStake()

  if (currentBeeMode() === 'full') {
    expect(parseFloat(stake.toDecimalString())).toBeGreaterThan(200)
  } else {
    expect(parseFloat(stake.toDecimalString())).toBe(0)
  }
})

test('POST stake', async () => {
  if (currentBeeMode() !== 'full') {
    return
  }

  const stakePreviously = await bee.getStake()

  let transactionId = await bee.depositStake('1')
  expect(transactionId.toHex()).toHaveLength(64)

  await System.waitFor(
    async () => {
      const stake = await bee.getStake()

      return stake.eq(stakePreviously.plus('1'))
    },
    Dates.seconds(1),
    180,
  )

  transactionId = await bee.depositStake(BZZ.fromPLUR(1n))
  expect(transactionId.toHex()).toHaveLength(64)

  await System.waitFor(
    async () => {
      const stake = await bee.getStake()

      return stake.eq(stakePreviously.plus('2'))
    },
    Dates.seconds(1),
    180,
  )
})
