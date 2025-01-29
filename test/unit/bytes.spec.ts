import { Bytes } from '../../src'

test('Bytes.keccak256', () => {
  expect(Bytes.keccak256(Bytes.fromUtf8('')).toHex()).toBe(
    'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  )
})
