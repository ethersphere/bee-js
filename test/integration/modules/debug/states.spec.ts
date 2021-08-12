import { beeDebugKy, commonMatchers } from '../../../utils'
import * as states from '../../../../src/modules/debug/states'

const BEE_DEBUG_URL = beeDebugKy()
commonMatchers()

describe('modules/states', () => {
  describe('chainstate', () => {
    it('should fetch the chainstate', async () => {
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
    it('should fetch the reserve state', async () => {
      const state = await states.getReserveState(BEE_DEBUG_URL)

      expect(state).toHaveProperty('radius')
      expect(state).toHaveProperty('available')
      expect(state).toHaveProperty('outer')
      expect(state).toHaveProperty('inner')
      expect(state.radius).toBeType('number')
      expect(state.available).toBeType('number')
      expect(state.outer).toBeNumberString()
      expect(state.inner).toBeNumberString()
    })
  })
})
