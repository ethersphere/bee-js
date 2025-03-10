import { MantarayNode } from '../../src'
import { arbitraryReference } from '../utils'

const ENCODER = new TextEncoder()

test('MantarayNode basic', () => {
  const node = new MantarayNode()
  node.addFork('foo', arbitraryReference())
  node.addFork('foobar', arbitraryReference())
  node.addFork('foobarbaz', arbitraryReference())
  node.addFork('fooxyz', arbitraryReference())
  expect(node.forks.size).toBe(1)
  expect(node.collect()).toHaveLength(4)

  expect(node.find('foo')).toHaveProperty('fullPath', ENCODER.encode('foo'))
  expect(node.find('foobar')).toHaveProperty('fullPath', ENCODER.encode('foobar'))
  expect(node.find('foobarbaz')).toHaveProperty('fullPathString', 'foobarbaz')
  expect(node.find('fooxyz')).toHaveProperty('fullPathString', 'fooxyz')

  const fooNode = node.find('foo')!
  expect(fooNode.path).toEqual(ENCODER.encode('foo'))
  expect(fooNode.forks.size).toBe(2)
  expect(fooNode.find('bar')).toBeTruthy()
  expect(fooNode.find('barbaz')).toBeTruthy()
  expect(fooNode.find('xyz')).toBeTruthy()

  const foobarNode = node.find('foobar')!
  expect(foobarNode.path).toEqual(ENCODER.encode('bar'))
  expect(foobarNode.forks.size).toBe(1)
  expect(foobarNode.find('baz')).toBeTruthy()

  const foobarbazNode = node.find('foobarbaz')!
  expect(foobarbazNode.path).toEqual(ENCODER.encode('baz'))
  expect(foobarbazNode.forks.size).toBe(0)

  node.removeFork('foobar')
  expect(node.find('foobar')).toBeNull()
  expect(node.find('foobarbaz')).toBeTruthy()
  expect(node.collect()).toHaveLength(3)

  node.removeFork('foobarbaz')
  expect(node.find('foobarbaz')).toBeNull()
  expect(node.collect()).toHaveLength(2)
})

test('MantarayNode long', () => {
  const htmlPath = '/Code/Swarm/bee-js/test/coverage/lcov-report/index.html'
  const jsPath = '/Code/Swarm/bee-js/test/coverage/lcov-report/index.js'
  const dsStorePath = '/Code/Swarm/bee-js/test/coverage/.DS_Store'

  const node = new MantarayNode()

  node.addFork(htmlPath, arbitraryReference())
  expect(node.collect()).toHaveLength(1)
  node.addFork(jsPath, arbitraryReference())
  expect(node.collect()).toHaveLength(2)
  node.addFork(dsStorePath, arbitraryReference())
  expect(node.collect()).toHaveLength(3)

  expect(node.find(htmlPath)).toHaveProperty('fullPathString', htmlPath)
  expect(node.find(jsPath)).toHaveProperty('fullPath', ENCODER.encode(jsPath))
  expect(node.find(dsStorePath)).toHaveProperty('fullPath', ENCODER.encode(dsStorePath))

  node.removeFork(dsStorePath)

  expect(node.find(htmlPath)).toHaveProperty('fullPath', ENCODER.encode(htmlPath))
  expect(node.find(jsPath)).toHaveProperty('fullPathString', jsPath)
  expect(node.find(dsStorePath)).toBeNull()
  expect(node.collect()).toHaveLength(2)
})
