import { Bee } from '../../src'
import { assertBeeUrl } from '../../src/utils/url'

describe('URL utils', () => {
  test('when URL contains bad port, assertBeeUrl throws', () => {
    expect(() => assertBeeUrl('http://localhost:25')).toThrow('Port in URL is considered bad port and cannot be used!')
    expect(() => assertBeeUrl('http://localhost:69')).toThrow('Port in URL is considered bad port and cannot be used!')
  })

  test('Bee constructor rejects bad ports', () => {
    expect(() => new Bee('http://localhost:25')).toThrow('Port in URL is considered bad port and cannot be used!')
    expect(() => new Bee('http://localhost:69')).toThrow('Port in URL is considered bad port and cannot be used!')
  })
})
