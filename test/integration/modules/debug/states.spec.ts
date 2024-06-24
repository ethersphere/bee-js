import { expect } from 'chai'
import * as states from '../../../../src/modules/debug/states'
import { beeKyOptions, commonMatchers } from '../../../utils'

const BEE_URL = beeKyOptions()
commonMatchers()

describe('modules/states', () => {
  describe('chainstate', () => {
    it('should fetch the chainstate', async function () {
      const state = await states.getChainState(BEE_URL)

      expect(state).to.have.property('block')
      expect(state).to.have.property('totalAmount')
      expect(state).to.have.property('currentPrice')
      expect(state.block).to.be.a('number')
      expect(state.totalAmount).to.be.numberString()
      expect(state.currentPrice).to.be.numberString()
    })
  })
  describe('ReserveState', () => {
    it('should fetch the reserve state', async function () {
      const state = await states.getReserveState(BEE_URL)
      expect(state).to.have.property('commitment')
      expect(state).to.have.property('radius')
      expect(state).to.have.property('storageRadius')
      expect(state.radius).a('number')
      expect(state.commitment).a('number')
      expect(state.storageRadius).a('number')
    })
  })
})
