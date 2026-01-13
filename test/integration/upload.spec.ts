import { Binary, MerkleTree, Types } from 'cafe-utility'
import { ReadStream } from 'fs'
import { BeeRequest, BeeRequestOptions, MantarayNode, NULL_ADDRESS } from '../../src'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import { makeCollectionFromFileList } from '../../src/utils/collection'
import { PrivateKey, Span } from '../../src/utils/typed-bytes'
import { batch, makeBee } from '../utils'

const bee = makeBee()
const encoder = new TextEncoder()
const decoder = new TextDecoder()

test('POST encrypted data', async () => {
  const data = 'Shh!'
  const response = await bee.uploadData(batch(), data, { encrypt: true })
  expect(response.reference.length).toBe(64)

  // TODO: ts is confused about [Symbol.asyncIterator]()
  const stream = (await bee.downloadReadableData(response.reference)) as unknown as ReadStream

  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const concatenated = Binary.concatBytes(...chunks)
  expect(decoder.decode(concatenated)).toBe(data)
})

test('POST encrypted file', async () => {
  const file = new File(['Shh!'], 'secret.txt', { type: 'text/plain' })
  const response = await bee.uploadFile(batch(), file, 'secret.txt', { encrypt: true })

  const download = await bee.downloadReadableFile(response.reference)
  // TODO: ts is confused about [Symbol.asyncIterator]()
  const stream = download.data as unknown as ReadStream

  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const concatenated = Binary.concatBytes(...chunks)
  expect(decoder.decode(concatenated)).toBe(await file.text())
})

test('POST chunk', async () => {
  const cac = makeContentAddressedChunk('Hello, Swarm!')
  const expectedHash = '680bb26ce329867d9063251135dea6f02b58d0ef3d4eb9076c3d5fc03fe54cf6'

  // calculate hash locally
  expect(cac.address.toHex()).toBe(expectedHash)
  expect(cac.span.toBigInt()).toBe(13n)

  // upload the chunk and compare
  const response = await bee.uploadChunk(batch(), cac)
  expect(response.reference.toHex()).toBe(expectedHash)

  // download the chunk and compare
  const downloaded = makeContentAddressedChunk((await bee.downloadChunk(expectedHash)).slice(Span.LENGTH))
  expect(downloaded.payload.toUtf8()).toBe('Hello, Swarm!')
  expect(downloaded.address.toHex()).toBe(expectedHash)
})

test('POST bytes', async () => {
  const data = 'Hello, Swarm!'
  const expectedHash = '680bb26ce329867d9063251135dea6f02b58d0ef3d4eb9076c3d5fc03fe54cf6'
  const response = await bee.uploadData(batch(), data)
  expect(response.reference.toHex()).toBe(expectedHash)

  // download the data and compare
  const downloaded = await bee.downloadData(response.reference)
  expect(downloaded.toUtf8()).toBe(data)

  // reconstruct the data with makeContentAddressedChunk
  const cac = makeContentAddressedChunk(data)
  expect(cac.address.toHex()).toBe(expectedHash)

  // reconstruct the data with MerkleTree
  const root = await MerkleTree.root(cac.payload.toUint8Array())
  expect(Binary.uint8ArrayToHex(root.hash())).toBe(expectedHash)
})

test('POST bzz', async () => {
  const data = '<h1>Hello, Swarm!</h1>'
  const expectedHash = '233c03b449cf410692475fd2e6bde5fa940563bf583cde2833ee7f5b7d23dbe4'
  const response = await bee.uploadFile(batch(), data, 'index.html', { contentType: 'text/html' })
  expect(response.reference.toHex()).toBe(expectedHash)

  // reconstruct the data with unmarshal
  const unmarshalled = await MantarayNode.unmarshal(bee, response.reference)
  await unmarshalled.loadRecursively(bee)
  expect((await unmarshalled.calculateSelfAddress()).toHex()).toBe(expectedHash)

  // reconstruct the data with MantarayNode
  const cac = makeContentAddressedChunk(data)
  const mantaray = new MantarayNode()
  mantaray.addFork('/', NULL_ADDRESS, {
    'website-index-document': 'index.html',
  })
  mantaray.addFork('index.html', cac.address, {
    'Content-Type': 'text/html',
    Filename: 'index.html',
  })
  expect((await mantaray.calculateSelfAddress()).toHex()).toBe(expectedHash)
})

test('POST soc', async () => {
  const data = 'Hello, Swarm!'
  const expectedHash = 'b97483657307335cf5519c4e55ae5190896dc93d1ec77cb18634f5707691460a'
  const identifier = NULL_ADDRESS
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  const writer = bee.makeSOCWriter(privateKey)
  const response = await writer.upload(batch(), identifier, encoder.encode(data))
  expect(response.reference.toHex()).toBe(expectedHash)

  // download the data and compare
  const reader = bee.makeSOCReader(new PrivateKey(privateKey).publicKey().address())
  const downloaded = await reader.download(identifier)
  expect(downloaded.payload.toUtf8()).toBe(data)

  // reconstruct the data with makeSingleOwnerChunk
  const cac = makeContentAddressedChunk(data)
  const soc = cac.toSingleOwnerChunk(identifier, privateKey)
  expect(soc.address.toHex()).toBe(expectedHash)
})

test('bee.uploadFiles', async () => {
  const file1 = new File(['Hello, Swarm!'], 'index.html', { type: 'text/html' })
  const file2 = new File(['Hello, World!'], 'hello.txt', { type: 'text/plain' })
  const response = await bee.uploadFiles(batch(), [file1, file2])
  expect(response.reference).toBeTruthy()
})

test('bee.uploadCollection', async () => {
  const file1 = new File(['Hello, Swarm!'], 'index.html', { type: 'text/html' })
  const file2 = new File(['Hello, World!'], 'hello.txt', { type: 'text/plain' })
  const collection = makeCollectionFromFileList([file1, file2])
  const response = await bee.uploadCollection(batch(), collection)
  expect(response.reference).toBeTruthy()
})

test('redundancy levels', async () => {
  const message = 'Hello, Swarm!'
  const file = new File(['Hello, Swarm!'], 'index.html', { type: 'text/html' })
  const collection = makeCollectionFromFileList([file])

  let runs = 0

  const requestOptions: BeeRequestOptions = {
    onRequest: (request: BeeRequest) => {
      expect(Types.asObject(request.headers)['swarm-redundancy-level']).toBe('1')
      runs++
    },
  }

  await bee.uploadData(batch(), message, { redundancyLevel: 1 }, requestOptions)
  await bee.uploadFile(batch(), message, undefined, { redundancyLevel: 1 }, requestOptions)
  await bee.uploadFiles(batch(), [file], { redundancyLevel: 1 }, requestOptions)
  await bee.uploadCollection(batch(), collection, { redundancyLevel: 1 }, requestOptions)

  expect(runs).toBe(4)
})
