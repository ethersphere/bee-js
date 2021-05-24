import { beeDebugUrl, commonMatchers } from '../../../utils'
import * as states from '../../../../src/modules/debug/states'

const BEE_DEBUG_URL = beeDebugUrl()
commonMatchers()

describe('modules/states', () => {
  describe('chainstate', () => {
    it('should fetch the chainstate', async () => {
      const state = await states.getChainState(BEE_DEBUG_URL)

      expect(state).toHaveProperty('block')
      expect(state).toHaveProperty('totalAmount')
      expect(state).toHaveProperty('currentPrice')
      expect(state.block).toBeType('bigint')
      expect(state.totalAmount).toBeType('bigint')
      expect(state.currentPrice).toBeType('bigint')
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
      expect(state.outer).toBeType('number')
      expect(state.inner).toBeType('number')
    })
  })
})
