import { Bytes, makeBytes } from '../../../src/utils/bytes'
import { HexString, hexToBytes } from '../../../src/utils/hex'
import { readUint64BigEndian, writeUint64BigEndian, writeUint64LittleEndian } from '../../../src/utils/uint64'
import { expect } from 'chai'

describe('uint64', () => {
  describe('little endian', () => {
    it('zero', () => {
      const uint64 = writeUint64LittleEndian(0)
      const zero = makeBytes(8)

      expect(uint64).to.eql(zero)
    })

    it('one', () => {
      const uint64 = writeUint64LittleEndian(1)
      const one = hexToBytes('0100000000000000' as HexString)

      expect(uint64).to.eql(one)
    })

    it('deadbeef', () => {
      const uint64 = writeUint64LittleEndian(0xdeadbeef)
      const deadbeef = hexToBytes('efbeadde00000000' as HexString)

      expect(uint64).to.eql(deadbeef)
    })
  })

  describe('big endian', () => {
    describe('write', () => {
      it('zero', () => {
        const uint64 = writeUint64BigEndian(0)
        const zero = makeBytes(8)

        expect(uint64).to.eql(zero)
      })

      it('one', () => {
        const uint64 = writeUint64BigEndian(1)
        const one = hexToBytes('0000000000000001' as HexString)

        expect(uint64).to.eql(one)
      })

      it('deadbeef', () => {
        const uint64 = writeUint64BigEndian(0xdeadbeef)
        const deadbeef = hexToBytes('00000000deadbeef' as HexString)

        expect(uint64).to.eql(deadbeef)
      })
    })

    describe('read', () => {
      it('zero', () => {
        const zero = makeBytes(8)
        const value = readUint64BigEndian(zero)

        expect(value).to.eql(0)
      })

      it('one', () => {
        const one = hexToBytes('0000000000000001' as HexString) as Bytes<8>
        const value = readUint64BigEndian(one)

        expect(value).to.eql(1)
      })

      it('deadbeef', () => {
        const deadbeef = hexToBytes('00000000deadbeef' as HexString) as Bytes<8>
        const value = readUint64BigEndian(deadbeef)

        expect(value).to.eql(0xdeadbeef)
      })
    })

    describe('read and write', () => {
      it('zero', () => {
        const zero = makeBytes(8)
        const num = readUint64BigEndian(zero)
        const value = writeUint64BigEndian(num)

        expect(value).to.eql(zero)
      })

      it('one', () => {
        const one = hexToBytes('0000000000000001' as HexString) as Bytes<8>
        const num = readUint64BigEndian(one)
        const value = writeUint64BigEndian(num)

        expect(value).to.eql(one)
      })

      it('deadbeef', () => {
        const deadbeef = hexToBytes('00000000deadbeef' as HexString) as Bytes<8>
        const num = readUint64BigEndian(deadbeef)
        const value = writeUint64BigEndian(num)

        expect(value).to.eql(deadbeef)
      })
    })
  })
})
