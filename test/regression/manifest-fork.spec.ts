import { MantarayNode } from '../../src'
import { arbitraryReference, batch, makeBee } from '../utils'

test('should not throw Bytes#checkByteLength', async () => {
  const bee = makeBee()

  const paths = [
    'c/grants/index.xml',
    'c/grants/index.html',
    'c/ecosystem/index.xml',
    'c/ecosystem/index.html',
    'c/development-updates/index.xml',
    'c/development-updates/index.html',
    'c/events/index.xml',
    'c/events/index.html',
    'c/tutorials/index.xml',
    'c/tutorials/index.html',
    'css/main.bundle.min.4e55be0357e7dec25cf1bea80877847773ee67f75d09281900b7bd8c8d07b4cded5555fb3b9c01a3826e021712d0fd63866586c0aa832ebb86de60c217a2f288.css',
  ]

  const manifest = new MantarayNode()
  for (const path of paths) {
    manifest.addFork(path, arbitraryReference())
  }

  const result = await manifest.saveRecursively(bee, batch())

  const unmarshaled = await MantarayNode.unmarshal(bee, result.reference)
  await unmarshaled.loadRecursively(bee)

  const items = unmarshaled.collectAndMap()
  expect(Object.keys(items).length).toBe(paths.length)
})

test('should not throw SyntaxError', async () => {
  const bee = makeBee()

  const paths = [
    'c/ecosystem/index.xml',
    'c/ecosystem/index.html',
    'c/development-updates/index.xml',
    'c/development-updates/index.html',
    'c/events/index.xml',
    'c/events/index.html',
    'css/main.bundle.min.4e55be0357e7dec25cf1bea80877847773ee67f75d09281900b7bd8c8d07b4cded5555fb3b9c01a3826e021712d0fd63866586c0aa832ebb86de60c217a2f288.css',
  ]

  const manifest = new MantarayNode()
  for (const path of paths) {
    manifest.addFork(path, arbitraryReference())
  }

  const result = await manifest.saveRecursively(bee, batch())

  const unmarshaled = await MantarayNode.unmarshal(bee, result.reference)
  await unmarshaled.loadRecursively(bee)

  const items = unmarshaled.collectAndMap()
  expect(Object.keys(items).length).toBe(paths.length)
})
