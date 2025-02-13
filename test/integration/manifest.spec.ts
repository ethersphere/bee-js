import { MantarayNode } from '../../src'
import { arbitraryReference, batch, makeBee } from '../utils'

test('manifest spec', async () => {
  const bee = makeBee()

  const node = new MantarayNode()
  node.addFork('images/swarm.png', arbitraryReference())
  node.addFork('index.html', arbitraryReference())
  node.addFork('swarm.bzz', arbitraryReference())

  const values = node.collect()

  expect(values).toHaveLength(3)
  expect(values[0].fullPathString).toBe('index.html')
  expect(values[1].fullPathString).toBe('images/swarm.png')
  expect(values[2].fullPathString).toBe('swarm.bzz')

  const root = await node.saveRecursively(bee, batch())

  const unmarshaled = await MantarayNode.unmarshal(bee, root.reference)
  await unmarshaled.loadRecursively(bee)

  const unmarshaledValues = unmarshaled.collect()

  expect(unmarshaledValues).toHaveLength(3)
  expect(unmarshaledValues[0].fullPathString).toBe('images/swarm.png')
  expect(unmarshaledValues[1].fullPathString).toBe('index.html')
  expect(unmarshaledValues[2].fullPathString).toBe('swarm.bzz')
})
