import { Binary } from 'cafe-utility'
import { ReadStream } from 'fs'
import { MantarayNode, NULL_ADDRESS } from '../../src'
import { makeBee } from '../utils'

test('GET bzz (ENS)', async () => {
  const bee = makeBee()

  const data = await bee.downloadFile('deadcafe.eth')

  expect(data.name).toBe('jiawei-zhao-BsXeYX3efOI-unsplash.jpg')
  expect(data.contentType).toBe('image/jpeg')
  expect(data.data.length).toBe(73892)
})

test('GET bytes (ENS)', async () => {
  const bee = makeBee()

  const data = await bee.downloadData('deadcafe.eth')

  const manifest = MantarayNode.unmarshalFromData(data.toUint8Array(), NULL_ADDRESS)
  await manifest.loadRecursively(bee)

  const docs = manifest.getDocsMetadata()

  expect(docs.indexDocument).toBe('jiawei-zhao-BsXeYX3efOI-unsplash.jpg')
})

test('GET readable bytes (ENS)', async () => {
  const bee = makeBee()

  const readable = await bee.downloadReadableData('deadcafe.eth')

  const parts: Uint8Array[] = []
  for await (const part of readable as unknown as ReadStream) {
    parts.push(part)
  }

  const data = Binary.concatBytes(...parts)

  const manifest = MantarayNode.unmarshalFromData(data, NULL_ADDRESS)
  await manifest.loadRecursively(bee)

  const docs = manifest.getDocsMetadata()

  expect(docs.indexDocument).toBe('jiawei-zhao-BsXeYX3efOI-unsplash.jpg')
})
