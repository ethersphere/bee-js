import { FixedPointNumber } from 'cafe-utility'
import { currentBeeMode, makeBee } from '../utils'

const bee = makeBee()

test('GET stake', async () => {
  const stake = await bee.getStake()
  const bzz = new FixedPointNumber(stake, 16)

  if (currentBeeMode() === 'full') {
    expect(parseFloat(bzz.toDecimalString())).toBeGreaterThan(200)
  } else {
    expect(parseFloat(bzz.toDecimalString())).toBe(0)
  }
})

test('POST stake', async () => {
  if (currentBeeMode() !== 'full') {
    return
  }

  await bee.depositStake('1')
  // bee accepted the request
})
