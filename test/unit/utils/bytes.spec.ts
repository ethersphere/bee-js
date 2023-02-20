import { wrapBytesWithHelpers } from '../../../src/utils/bytes'
import { expect } from 'chai'

describe('bytes', () => {
  describe('wrapBytesWithHelpers', () => {
    it('should still be Uint8Array', () => {
      const dataA = wrapBytesWithHelpers(new Uint8Array([104, 101, 108, 108, 111, 32]))
      const dataB = wrapBytesWithHelpers(new Uint8Array([119, 111, 114, 108, 100]))

      expect(dataA.text()).to.eql('hello ')
      expect(dataB.text()).to.eql('world')
      expect(new TextDecoder().decode(new Uint8Array([...dataA, ...dataB]))).to.eql('hello world')
    })

    it('should convert to string', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])

      expect(wrapBytesWithHelpers(data).text()).to.eql('hello world')
      expect(wrapBytesWithHelpers(new Uint8Array([])).text()).to.eql('')
      expect(() => wrapBytesWithHelpers(null as unknown as Uint8Array).text()).to.throw()
    })

    it('should convert to json', () => {
      const data = new Uint8Array([123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 125])
      expect(wrapBytesWithHelpers(data).json()).to.eql({ hello: 'world' })
    })

    it('should convert to hex', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
      expect(wrapBytesWithHelpers(data).hex()).to.eql('68656c6c6f20776f726c64')
    })
  })
})
