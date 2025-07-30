import { MantarayNode } from '../../src'
import { makeBee } from '../utils'

test('decrypt a manifest that is encrypted and obfuscated', async () => {
  const bee = makeBee()
  const reference =
    '2874296904931ffea2ae85c7a2646756e2c475d5d5983c14c1002a510a4a3ca0b53ee9d62fd060b58cab6b47d3f26b4f3f3c614c74bd689af2bfa756d80152ca'

  const node = await MantarayNode.unmarshal(bee, reference)
  await node.loadRecursively(bee)

  const items = node.collectAndMap()
  expect(items['.editorconfig']).toBe(
    'ef7b55dd0059af17c861e4b7b81b62d32d131b510eae1f21e8b550f864305ebca4546334599af9a91052cc183216e336e9fc815ebc3f7fc8cc88004a5e81f426',
  )
})
