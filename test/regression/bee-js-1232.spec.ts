import { makeCollectionFromFileList } from '../../src/utils/collection'
import { batch, makeBee } from '../utils'

test('bee-js/1232 - uploadData on empty data does not throw a confusing error', async () => {
  const bee = makeBee()

  const fromString = await bee.data.upload(batch(), '')
  const fromUint8Array = await bee.data.upload(batch(), new Uint8Array(0))
  const fromBuffer = await bee.data.upload(batch(), Buffer.alloc(0))

  expect(fromString.reference.toHex()).toBe(fromUint8Array.reference.toHex())
  expect(fromString.reference.toHex()).toBe(fromBuffer.reference.toHex())

  const downloaded = await bee.data.download(fromString.reference)
  expect(downloaded.length).toBe(0)
})

test('bee-js/1232 - file.upload on empty data does not throw a confusing error', async () => {
  const bee = makeBee()

  const fromString = await bee.file.upload(batch(), '', 'empty.txt')
  const fromUint8Array = await bee.file.upload(batch(), new Uint8Array(0), 'empty.txt')
  const fromFile = await bee.file.upload(batch(), new File([], 'empty.txt', { type: 'text/plain' }))

  for (const result of [fromString, fromUint8Array, fromFile]) {
    const downloaded = await bee.file.download(result.reference)
    expect(downloaded.data.length).toBe(0)
  }
})

test('bee-js/1232 - collection.upload with an empty file does not throw a confusing error', async () => {
  const bee = makeBee()

  const file = new File([], 'empty.txt', { type: 'text/plain' })
  const collection = makeCollectionFromFileList([file])
  const uploaded = await bee.collection.upload(batch(), collection)

  const downloaded = await bee.file.download(uploaded.reference, 'empty.txt')
  expect(downloaded.data.length).toBe(0)
})
