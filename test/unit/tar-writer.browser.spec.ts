import { Collection } from '../../src'
// Import from the undecorated path — the resolver maps it to tar.browser.ts at
// runtime, but TypeScript sees tar.ts, which matches what writeTar.browser expects.
import { TarStream } from '../../src/utils/tar'
import { writeTar } from '../../src/utils/tar-writer.browser'

test('writeTar: writes File content via arrayBuffer', async () => {
  const content = 'hello browser'
  const file = new File([content], 'hello.txt', { type: 'text/plain' })
  const collection: Collection = [{ path: 'hello.txt', size: file.size, file }]

  const tar = new TarStream()
  await writeTar(collection, tar as never)
  await tar.end()

  // At runtime tar is the browser TarStream whose output is a Uint8Array.
  const output = (tar as unknown as { output: Uint8Array }).output
  const encoded = new TextEncoder().encode(content)
  expect(output.slice(512, 512 + encoded.length)).toEqual(encoded)
})

test('writeTar: throws for collection item without file', async () => {
  const collection: Collection = [{ path: 'x.txt', size: 0 }]
  const tar = new TarStream()
  await expect(writeTar(collection, tar as never)).rejects.toThrow('Invalid collection item')
})
