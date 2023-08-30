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
})
