import { wrapBytesWithHelpers } from '../../src/utils/bytes'

describe('bytes', () => {
  describe('wrapBytesWithHelpers', () => {
    it('should still be Uint8Array', () => {
      const dataA = wrapBytesWithHelpers(new Uint8Array([104, 101, 108, 108, 111, 32]))
      const dataB = wrapBytesWithHelpers(new Uint8Array([119, 111, 114, 108, 100]))

      expect(dataA.text()).toEqual('hello ')
      expect(dataB.text()).toEqual('world')
      expect(new TextDecoder().decode(new Uint8Array([...dataA, ...dataB]))).toEqual('hello world')
    })

    it('should convert to string', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])

      expect(wrapBytesWithHelpers(data).text()).toEqual('hello world')
      expect(wrapBytesWithHelpers(new Uint8Array([])).text()).toEqual('')
      expect(() => wrapBytesWithHelpers((null as unknown) as Uint8Array).text()).toThrowError()
    })

    it('should convert to json', () => {
      const data = new Uint8Array([123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 125])
      expect(wrapBytesWithHelpers(data).json()).toEqual({ hello: 'world' })
    })

    it('should convert to hex', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
      expect(wrapBytesWithHelpers(data).hex()).toEqual('68656c6c6f20776f726c64')
    })
  })
})
