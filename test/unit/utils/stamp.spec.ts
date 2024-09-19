import * as Utils from '../../../src/utils/stamps'

describe('stamp', () => {
  describe('getStampUsage', () => {
    it('should return value', () => {
      expect(Utils.getStampUsage(4, 18, 16)).toBe(1)
    })
  })
  describe('getStampMaximumCapacityBytes', () => {
    it('should return value', () => {
      expect(Utils.getStampMaximumCapacityBytes(20)).toBe(4 * 1024 * 1024 * 1024)
    })
  })
  describe('getStampTtlSeconds', () => {
    it('should return value', () => {
      expect(Utils.getStampTtlSeconds(20_000_000_000)).toBe(4166666.6666666665)
    })
  })
  describe('getStampCostInBzz', () => {
    it('should return value', () => {
      expect(Utils.getStampCostInBzz(20, 20_000_000_000)).toBe(2.097152)
    })
  })
  describe('getStampCostInPlur', () => {
    it('should return value', () => {
      expect(Utils.getStampCostInPlur(20, 20_000_000_000)).toBe(20971520000000000)
    })
  })
  describe('reverse depth', () => {
    it('should return value 21', () => {
      expect(Utils.getDepthForCapacity(8)).toBe(21)
    })
    it('should return value 20', () => {
      expect(Utils.getDepthForCapacity(4)).toBe(20)
    })
    it('should return value 19', () => {
      expect(Utils.getDepthForCapacity(2)).toBe(19)
    })
    it('should return value 18', () => {
      expect(Utils.getDepthForCapacity(1)).toBe(18)
    })
    it('should return value 20 for 2.3', () => {
      expect(Utils.getDepthForCapacity(2.3)).toBe(20)
    })
    it('should return value 18 for 0', () => {
      expect(Utils.getDepthForCapacity(0)).toBe(18)
    })
    it('should return value 18 for negative value', () => {
      expect(Utils.getDepthForCapacity(-3)).toBe(18)
    })
  })

  describe('reverse amount', () => {
    it('should return 20_000_000_000 for 48,225308641975309 day (4166666.666666666666 sec / 86400)', () => {
      expect(Utils.getAmountForTtl(4166666.6666666665 / 86400)).toBe('20000000000')
    })
    it('should return 414720000 for < 0  value', () => {
      expect(Utils.getAmountForTtl(-1)).toBe('414720000')
    })
  })
})
