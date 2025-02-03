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

  await bee.depositStake('1')
  // bee accepted the request
})
