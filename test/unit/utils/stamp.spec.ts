import { expect } from 'chai'
import * as Utils from '../../../src/utils/stamps'

describe('stamp', () => {
  describe('getStampUsage', () => {
    it('should return value', () => {
      expect(Utils.getStampUsage(4, 18, 16)).to.eql(1)
    })
  })
  describe('getStampMaximumCapacityBytes', () => {
    it('should return value', () => {
      expect(Utils.getStampMaximumCapacityBytes(20)).to.eql(4 * 1024 * 1024 * 1024)
    })
  })
  describe('getStampTtlSeconds', () => {
    it('should return value', () => {
      expect(Utils.getStampTtlSeconds(20_000_000_000)).to.eql(4166666.6666666665)
    })
  })
  describe('getStampCostInBzz', () => {
    it('should return value', () => {
      expect(Utils.getStampCostInBzz(20, 20_000_000_000)).to.eql(2.097152)
    })
  })
  describe('getStampCostInPlur', () => {
    it('should return value', () => {
      expect(Utils.getStampCostInPlur(20, 20_000_000_000)).to.eql(20971520000000000)
    })
  })
  describe('reverse depth', () => {
    it('should return value 21', () => {
      expect(Utils.getDepthForCapacity(8)).to.eql(21)
    })
    it('should return value 20', () => {
      expect(Utils.getDepthForCapacity(4)).to.eql(20)
    })
    it('should return value 19', () => {
      expect(Utils.getDepthForCapacity(2)).to.eql(19)
    })
    it('should return value 18', () => {
      expect(Utils.getDepthForCapacity(1)).to.eql(18)
    })
    it('should return value 20 for 2.3', () => {
      expect(Utils.getDepthForCapacity(2.3)).to.eql(20)
    })
    it('should return value 18 for 0', () => {
      expect(Utils.getDepthForCapacity(0)).to.eql(18)
    })
    it('should return value 18 for negative value', () => {
      expect(Utils.getDepthForCapacity(-3)).to.eql(18)
    })
  })

  describe('reverse amount', () => {
    it('should return 20_000_000_000 for 48,225308641975309 day (4166666.666666666666 sec / 86400)', () => {
      expect(Utils.getAmountForTtl(4166666.6666666665 / 86400)).to.eql('20000000000')
    })
    it('should return 414720000 for < 0  value', () => {
      expect(Utils.getAmountForTtl(-1)).to.eql('414720000')
    })
  })
})
