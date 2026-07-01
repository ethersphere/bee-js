import { Random, Strings } from 'cafe-utility'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import { arbitraryPrivateKey, batch, makeBee } from '../utils'

const bee = makeBee()

test('unmarshal CAC', async () => {
  const cac = bee.makeContentAddressedChunk('content addressed chunk')
  const result = await bee.uploadChunk(batch(), cac)
  expect(result.reference.toHex()).toBe(cac.address.toHex())
  const download = await bee.downloadChunk(result.reference)
  const parsedCac = bee.unmarshalContentAddressedChunk(download)
  expect(parsedCac.payload.toUtf8()).toBe('content addressed chunk')
})

test('unmarshal SOC', async () => {
  const cac = bee.makeContentAddressedChunk('single owner chunk')
  const identifier = Strings.randomHex(64)
  const signer = arbitraryPrivateKey()
  const soc = cac.toSingleOwnerChunk(identifier, signer)
  const result = await bee.uploadChunk(batch(), soc)
  const download = await bee.downloadChunk(result.reference)
  const parsedSoc = bee.unmarshalSingleOwnerChunk(download, soc.address)
  expect(parsedSoc.payload.toUtf8()).toBe('single owner chunk')
})

test('make large SOC', async () => {
  const bytes = new Uint8Array(4096)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Random.intBetween(0, 255)
  }
  const cac = makeContentAddressedChunk(bytes)
  const identifier = Strings.randomHex(64)
  const signer = arbitraryPrivateKey()
  const soc = bee.makeSingleOwnerChunk(cac.address, cac.span, cac.payload, identifier, signer)
  const result = await bee.uploadChunk(batch(), soc)
  const download = await bee.downloadChunk(result.reference)
  const parsedSoc = bee.unmarshalSingleOwnerChunk(download, soc.address)
  expect(parsedSoc.payload.toHex()).toBe(soc.payload.toHex())
  expect(parsedSoc.payload.length).toBe(4096)
  const recreatedCac = bee.makeContentAddressedChunk(parsedSoc.payload)
  expect(recreatedCac.address.toHex()).toBe(cac.address.toHex())
  expect(recreatedCac.payload.toHex()).toBe(cac.payload.toHex())
  expect(recreatedCac.span.toBigInt()).toBe(cac.span.toBigInt())
})
