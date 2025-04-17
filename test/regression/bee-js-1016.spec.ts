import { MantarayNode } from '../../src'
import { arbitraryReference, batch, makeBee } from '../utils'

test("bee-js/1016 - existing fork's prefix already fully contains the new path", async () => {
  const files = [
    'favicon.ico',
    'index.html',
    'serve.json',
    'asset-manifest.json',
    'static/',
    'manifest.json',
    'robots.txt',
    'static/css/',
    'static/js/',
    'static/media/',
    'static/media/iAWriterMonoV.c56710c24fb4d02b22ab.ttf',
    'static/media/dashboard-logo.3d1155fe4ceade0f70818bb814ac8f2e.svg',
    'static/media/desktop-logo.3a2b1826c3a940584030325014428090.svg',
    'static/media/iAWriterQuattroV.e0feca2c3c19ff1fcfc6.ttf',
    'static/js/845.062bd405.chunk.js.map',
    'static/js/845.062bd405.chunk.js',
    'static/js/main.d64a2515.js.LICENSE.txt',
    'static/js/main.d64a2515.js.map',
    'static/js/main.d64a2515.js',
    'static/css/main.a13e65ba.css',
    'static/css/main.a13e65ba.css.map',
  ]
  const node = new MantarayNode()
  for (const file of files) {
    node.addFork(file, arbitraryReference())
  }
  // check that all paths are present before marshalling
  expect(node.collect()).toHaveLength(files.length)
  for (const file of files) {
    expect(node.find(file)?.fullPathString).toBe(file)
  }
  // upload the node
  const bee = makeBee()
  const result = await node.saveRecursively(bee, batch())
  // download and reconstruct the node
  const reconstructed = await MantarayNode.unmarshal(bee, result.reference)
  await reconstructed.loadRecursively(bee)
  // check that all paths are present after marshalling
  expect(reconstructed.collect().length).toBe(files.length)
  for (const file of files) {
    expect(reconstructed.find(file)?.fullPathString).toBe(file)
  }
})
