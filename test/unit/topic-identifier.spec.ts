import { Binary } from 'cafe-utility'
import { Identifier, Topic } from '../../src'

test('construct Topic', () => {
  const expected = '7e15a90abbff6ee821a98dfd278e2967c16a1f8d3fa62534bce0c231169befce'
  expect(Topic.fromString('chat:v1').toHex()).toBe(expected)
  expect(new Topic(expected).toHex()).toBe(expected)
  expect(new Topic(Binary.hexToUint8Array(expected)).toHex()).toBe(expected)
})

test('construct Identifier', () => {
  const expected = '7e15a90abbff6ee821a98dfd278e2967c16a1f8d3fa62534bce0c231169befce'
  expect(Identifier.fromString('chat:v1').toHex()).toBe(expected)
  expect(new Identifier(expected).toHex()).toBe(expected)
  expect(new Identifier(Binary.hexToUint8Array(expected)).toHex()).toBe(expected)
})
