import { sharedPrefixBits } from '../../src/modules/messaging'

test('sharedPrefixBits counts the shared leading bits', () => {
  expect(sharedPrefixBits(new Uint8Array([0x80]), new Uint8Array([0]))).toBe(0)
  expect(sharedPrefixBits(new Uint8Array([255, 0, 0]), new Uint8Array([255, 0, 1]))).toBe(23)
  expect(sharedPrefixBits(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(8)
})
