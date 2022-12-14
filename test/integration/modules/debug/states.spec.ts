import { beeDebugKyOptions, commonMatchers } from '../../../utils'
import * as states from '../../../../src/modules/debug/states'

const BEE_DEBUG_URL = beeDebugKyOptions()
commonMatchers()

describe('modules/states', () => {
  describe('chainstate', () => {
    it('should fetch the chainstate', async function () {
      const state = await states.getChainState(BEE_DEBUG_URL)

      expect(state).toHaveProperty('block')
      expect(state).toHaveProperty('totalAmount')
      expect(state).toHaveProperty('currentPrice')
      expect(state.block).toBeNumberString()
      expect(state.totalAmount).toBeNumberString()
      expect(state.currentPrice).toBeNumberString()
    })
  })
  describe('ReserveState', () => {
    it('should fetch the reserve state', async function () {
      const state = await states.getReserveState(BEE_DEBUG_URL)
      expect(state).toHaveProperty('commitment')
      expect(state).toHaveProperty('radius')
      expect(state).toHaveProperty('storageRadius')
      expect(state.radius).toBeType('number')
      expect(state.commitment).toBeType('number')
      expect(state.storageRadius).toBeType('number')
    })
  })
})
