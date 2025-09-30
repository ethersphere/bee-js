import { Bytes } from '../../src'
import { ResourceLocator } from '../../src/utils/resource-locator'

test('Bytes ctor when class information is lost but toHex exists', () => {
  const hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const object = {
    toHex: () => hex,
  }
  expect(new ResourceLocator(object as any).toString()).toBe(hex.slice(2))
  expect(new Bytes(object as any).toHex()).toBe(hex.slice(2))
})

test('Bytes ctor when recovery is impossible', () => {
  // null
  expect(() => new Bytes(null as any).toHex()).toThrow('Bytes#constructor: constructor parameter is falsy: null')
  expect(() => new ResourceLocator(null as any).toString()).toThrow(
    'Bytes#constructor: constructor parameter is falsy: null',
  )
  // bad object
  const object = {}
  expect(() => new ResourceLocator(object as any).toString()).toThrow('Bytes#constructor: unsupported type: object')
  expect(() => new Bytes(object as any).toHex()).toThrow('Bytes#constructor: unsupported type: object')
  // toHex not a fn
  const object2 = {
    toHex: 123,
  }
  expect(() => new ResourceLocator(object2 as any).toString()).toThrow('Bytes#constructor: unsupported type: object')
  expect(() => new Bytes(object2 as any).toHex()).toThrow('Bytes#constructor: unsupported type: object')
})
