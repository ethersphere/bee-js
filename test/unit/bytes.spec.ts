import { Bytes } from '../../src'

test('Bytes.keccak256', () => {
  expect(Bytes.keccak256(Bytes.fromUtf8('')).toHex()).toBe(
    'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  )

  expect(Bytes.keccak256(Bytes.fromUtf8('Hello, world!')).toHex()).toBe(
    'b6e16d27ac5ab427a7f68900ac5559ce272dc6c37c82b3e052246c82244c50e4',
  )
})
