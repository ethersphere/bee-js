import { Bytes, makeBytes } from '../../../src/utils/bytes'
import { HexString, hexToBytes } from '../../../src/utils/hex'
import { readUint64BigEndian, writeUint64BigEndian, writeUint64LittleEndian } from '../../../src/utils/uint64'

describe('uint64', () => {
  describe('little endian', () => {
    test('zero', () => {
      const uint64 = writeUint64LittleEndian(0)
      const zero = makeBytes(8)

      expect(uint64).to.equal(zero)
    })

    test('one', () => {
      const uint64 = writeUint64LittleEndian(1)
      const one = hexToBytes('0100000000000000' as HexString)

      expect(uint64).to.equal(one)
    })

    test('deadbeef', () => {
      const uint64 = writeUint64LittleEndian(0xdeadbeef)
      const deadbeef = hexToBytes('efbeadde00000000' as HexString)

      expect(uint64).to.equal(deadbeef)
    })
  })

  describe('big endian', () => {
    describe('write', () => {
      test('zero', () => {
        const uint64 = writeUint64BigEndian(0)
        const zero = makeBytes(8)

        expect(uint64).to.equal(zero)
      })

      test('one', () => {
        const uint64 = writeUint64BigEndian(1)
        const one = hexToBytes('0000000000000001' as HexString)

        expect(uint64).to.equal(one)
      })

      test('deadbeef', () => {
        const uint64 = writeUint64BigEndian(0xdeadbeef)
        const deadbeef = hexToBytes('00000000deadbeef' as HexString)

        expect(uint64).to.equal(deadbeef)
      })
    })

    describe('read', () => {
      test('zero', () => {
        const zero = makeBytes(8)
        const value = readUint64BigEndian(zero)

        expect(value).to.equal(0)
      })

      test('one', () => {
        const one = hexToBytes('0000000000000001' as HexString) as Bytes<8>
        const value = readUint64BigEndian(one)

        expect(value).to.equal(1)
      })

      test('deadbeef', () => {
        const deadbeef = hexToBytes('00000000deadbeef' as HexString) as Bytes<8>
        const value = readUint64BigEndian(deadbeef)

        expect(value).to.equal(0xdeadbeef)
      })
    })

    describe('read and write', () => {
      test('zero', () => {
        const zero = makeBytes(8)
        const num = readUint64BigEndian(zero)
        const value = writeUint64BigEndian(num)

        expect(value).to.equal(zero)
      })

      test('one', () => {
        const one = hexToBytes('0000000000000001' as HexString) as Bytes<8>
        const num = readUint64BigEndian(one)
        const value = writeUint64BigEndian(num)

        expect(value).to.equal(one)
      })

      test('deadbeef', () => {
        const deadbeef = hexToBytes('00000000deadbeef' as HexString) as Bytes<8>
        const num = readUint64BigEndian(deadbeef)
        const value = writeUint64BigEndian(num)

        expect(value).to.equal(deadbeef)
      })
    })
  })
})
