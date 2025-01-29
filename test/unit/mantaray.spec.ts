import { MantarayNode } from '../../src'
import { arbitraryReference } from '../utils'

const ENCODER = new TextEncoder()

test('MantarayNode', () => {
  const node = new MantarayNode()
  node.addFork('foo', arbitraryReference())
  node.addFork('foobar', arbitraryReference())
  node.addFork('foobarbaz', arbitraryReference())
  expect(node.forks.size).toBe(1)

  const fooNode = node.find('foo')!
  expect(fooNode.path).toEqual(ENCODER.encode('foo'))
  expect(fooNode.forks.size).toBe(1)
  expect(fooNode.find('bar')).toBeDefined()
  expect(fooNode.find('barbaz')).toBeDefined()

  const foobarNode = node.find('foobar')!
  expect(foobarNode.path).toEqual(ENCODER.encode('bar'))
  expect(foobarNode.forks.size).toBe(1)
  expect(foobarNode.find('baz')).toBeDefined()

  const foobarbazNode = node.find('foobarbaz')!
  expect(foobarbazNode.path).toEqual(ENCODER.encode('baz'))
  expect(foobarbazNode.forks.size).toBe(0)

  node.removeFork('foo')
  expect(node.forks.size).toBe(1)
  expect(node.find('foobar')).toBeDefined()
  expect(node.find('foo')).toBeNull()

  node.removeFork('foobarbaz')
  expect(node.find('foobarbaz')).toBeNull()
})
