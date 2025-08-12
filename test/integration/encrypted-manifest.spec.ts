import { createReadStream } from 'fs'
import { readFile } from 'fs/promises'
import { MantarayNode } from '../../src'
import { batch, makeBee } from '../utils'

test('decrypt a manifest that is encrypted and obfuscated', async () => {
  const bee = makeBee()

  const result = await bee.uploadFile(batch(), createReadStream('.editorconfig'), '.editorconfig', { encrypt: true })

  const node = await MantarayNode.unmarshal(bee, result.reference)
  await node.loadRecursively(bee)

  const items = node.collectAndMap()
  expect(items['.editorconfig']).toBeDefined()

  const data = await bee.downloadData(items['.editorconfig'])
  expect(data.toUtf8()).toEqual(await readFile('.editorconfig', 'utf-8'))
})
