import { MantarayNode, NULL_ADDRESS, PrivateKey, Topic } from '../../src'
import { arbitraryPrivateKey, arbitraryReference, batch, makeBee } from '../utils'

test('Manifest save/load/collect', async () => {
  const bee = makeBee()

  const ref1 = arbitraryReference()
  const ref2 = arbitraryReference()
  const ref3 = arbitraryReference()

  const node = new MantarayNode()
  node.addFork('images/swarm.png', ref1)
  node.addFork('index.html', ref2)
  node.addFork('swarm.bzz', ref3)

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

  expect(unmarshaled.collectAndMap()).toEqual({
    'index.html': ref2,
    'images/swarm.png': ref1,
    'swarm.bzz': ref3,
  })
})

test('Manifest default indexDocument', async () => {
  const bee = makeBee()

  const uploadResult = await bee.uploadFile(batch(), 'Greetings, Earthlings!', 'greetings.txt')

  const node = await MantarayNode.unmarshal(bee, uploadResult.reference)
  await node.loadRecursively(bee)

  const docs = node.getDocsMetadata()

  expect(docs.indexDocument).toBe('greetings.txt')
  expect(docs.errorDocument).toBeNull()
})

test('Manifest explicit indexDocument & errorDocument', async () => {
  const bee = makeBee()

  const uploadResult = await bee.uploadFiles(batch(), [new File(['Greetings, Bees!'], 'hi.txt')], {
    indexDocument: 'hi.txt',
    errorDocument: 'error.html',
  })

  const node = await MantarayNode.unmarshal(bee, uploadResult.reference)
  await node.loadRecursively(bee)

  const docs = node.getDocsMetadata()

  expect(docs.indexDocument).toBe('hi.txt')
  expect(docs.errorDocument).toBe('error.html')
})

test('Manifest feed resolver', async () => {
  const bee = makeBee()

  const fileResult = await bee.uploadFile(batch(), 'This is the first update in the feed', 'update.txt')

  const privateKey = new PrivateKey(arbitraryPrivateKey())
  const owner = privateKey.publicKey().address()
  const topic = Topic.fromString('Manifest test')

  const feedWriter = bee.makeFeedWriter(topic, privateKey)
  await feedWriter.upload(batch(), fileResult.reference)

  const feedManifest = await bee.createFeedManifest(batch(), topic, owner)

  const node = await MantarayNode.unmarshal(bee, feedManifest)
  await node.loadRecursively(bee)
  const metadata = node.getRootMetadata().getOrThrow()
  expect(metadata).toEqual({
    'swarm-feed-owner': owner.toHex(),
    'swarm-feed-topic': topic.toHex(),
    'swarm-feed-type': 'Sequence',
  })

  const feedUpdate = (await node.resolveFeed(bee)).getOrThrow()
  const resolved = MantarayNode.unmarshalFromData(feedUpdate.payload.toUint8Array(), NULL_ADDRESS)
  await resolved.loadRecursively(bee)

  const docs = resolved.getDocsMetadata()

  expect(docs.indexDocument).toBe('update.txt')
})

test('Manifest no feed to resolve', async () => {
  const bee = makeBee()

  const uploadResult = await bee.uploadFile(batch(), 'This is not a feed', 'feed.txt')

  const node = await MantarayNode.unmarshal(bee, uploadResult.reference)
  await node.loadRecursively(bee)

  const feedUpdate = await node.resolveFeed(bee)

  expect(feedUpdate.value).toBeNull()
})

test('Manifest add fork with foreign path', async () => {
  const bee = makeBee()

  const manifest = new MantarayNode()
  manifest.addFork('c/中文/index.xml', arbitraryReference())
  manifest.addFork('c/中文/index.html', arbitraryReference())

  const result = await manifest.saveRecursively(bee, batch())

  const unmarshaled = await MantarayNode.unmarshal(bee, result.reference)
  await unmarshaled.loadRecursively(bee)

  const items = unmarshaled.collectAndMap()
  expect(items['c/中文/index.xml']).toBeDefined()
  expect(items['c/中文/index.html']).toBeDefined()
})

test('Manifest save/load with ACT stores history address in fork metadata', async () => {
  const bee = makeBee()

  const ref1 = arbitraryReference()
  const ref2 = arbitraryReference()

  const node = new MantarayNode()
  node.addFork('folder/file1.txt', ref1, { 'Content-Type': 'text/plain' })
  node.addFork('folder/file2.txt', ref2, { 'Content-Type': 'text/plain' })

  const result = await node.saveRecursively(bee, batch(), { act: true })

  expect(result.reference.toHex()).toHaveLength(64)
  expect(result.historyAddress.getOrThrow().toHex()).toHaveLength(64)
})

test('Manifest save/load with ACT preserves structure', async () => {
  const bee = makeBee()
  const { publicKey } = await bee.getNodeAddresses()

  const fileData = 'test file content for ACT preservation'
  const fileUpload = await bee.uploadData(batch(), fileData)

  const node = new MantarayNode()
  node.addFork('deep/nested/file.txt', fileUpload.reference, {
    'Content-Type': 'text/plain',
    Filename: 'file.txt',
  })

  const result = await node.saveRecursively(bee, batch(), { act: true })
  const rootHistoryAddress = result.historyAddress.getOrThrow()

  const loadedNode = await MantarayNode.unmarshal(bee, result.reference, {
    actHistoryAddress: rootHistoryAddress,
    actPublisher: publicKey,
  })

  await loadedNode.loadRecursively(bee, { actPublisher: publicKey })

  const mapping = loadedNode.collectAndMap()

  expect(mapping['deep/nested/file.txt']).toBeDefined()
  expect(mapping['deep/nested/file.txt']).toBe(fileUpload.reference.toHex())
})

test('Manifest save/load with ACT nested folders', async () => {
  const bee = makeBee()
  const { publicKey } = await bee.getNodeAddresses()

  const file1 = await bee.uploadData(batch(), 'content-1')
  const file2 = await bee.uploadData(batch(), 'content-2')
  const file3 = await bee.uploadData(batch(), 'content-3')

  const node = new MantarayNode()
  node.addFork('a/b/c/file1.txt', file1.reference)
  node.addFork('a/b/file2.txt', file2.reference)
  node.addFork('a/file3.txt', file3.reference)

  const result = await node.saveRecursively(bee, batch(), { act: true })

  const loadedNode = await MantarayNode.unmarshal(bee, result.reference, {
    actHistoryAddress: result.historyAddress.getOrThrow(),
    actPublisher: publicKey,
  })

  await loadedNode.loadRecursively(bee, { actPublisher: publicKey })

  const mapping = loadedNode.collectAndMap()

  expect(Object.keys(mapping)).toHaveLength(3)
  expect(mapping['a/b/c/file1.txt']).toBe(file1.reference.toHex())
  expect(mapping['a/b/file2.txt']).toBe(file2.reference.toHex())
  expect(mapping['a/file3.txt']).toBe(file3.reference.toHex())
})

test('Manifest save/load with ACT can download and verify content', async () => {
  const bee = makeBee()
  const { publicKey } = await bee.getNodeAddresses()

  const originalContent = 'This is the secret content that should be encrypted and decrypted correctly!'
  const fileUpload = await bee.uploadData(batch(), originalContent)

  const node = new MantarayNode()
  node.addFork('secret/data.txt', fileUpload.reference, {
    'Content-Type': 'text/plain',
    Filename: 'data.txt',
  })

  const result = await node.saveRecursively(bee, batch(), { act: true })

  const loadedNode = await MantarayNode.unmarshal(bee, result.reference, {
    actHistoryAddress: result.historyAddress.getOrThrow(),
    actPublisher: publicKey,
  })

  await loadedNode.loadRecursively(bee, { actPublisher: publicKey })

  const mapping = loadedNode.collectAndMap()
  const fileReference = mapping['secret/data.txt']

  expect(fileReference).toBeDefined()

  const downloadedData = await bee.downloadData(fileReference)
  expect(downloadedData.toUtf8()).toBe(originalContent)
})

test('Manifest save/load with ACT single file at root', async () => {
  const bee = makeBee()
  const { publicKey } = await bee.getNodeAddresses()

  const content = 'root-level-file-content'
  const fileUpload = await bee.uploadData(batch(), content)

  const node = new MantarayNode()
  node.addFork('readme.txt', fileUpload.reference)

  const result = await node.saveRecursively(bee, batch(), { act: true })

  const loadedNode = await MantarayNode.unmarshal(bee, result.reference, {
    actHistoryAddress: result.historyAddress.getOrThrow(),
    actPublisher: publicKey,
  })

  await loadedNode.loadRecursively(bee, { actPublisher: publicKey })

  const mapping = loadedNode.collectAndMap()

  expect(Object.keys(mapping)).toHaveLength(1)
  expect(mapping['readme.txt']).toBe(fileUpload.reference.toHex())
})

test('Manifest save/load with ACT preserves existing metadata', async () => {
  const bee = makeBee()
  const { publicKey } = await bee.getNodeAddresses()

  const fileUpload = await bee.uploadData(batch(), 'test-content')

  const node = new MantarayNode()
  node.addFork('file.txt', fileUpload.reference, {
    'Content-Type': 'text/plain',
    'Custom-Header': 'custom-value',
    Filename: 'file.txt',
  })

  const result = await node.saveRecursively(bee, batch(), { act: true })

  const loadedNode = await MantarayNode.unmarshal(bee, result.reference, {
    actHistoryAddress: result.historyAddress.getOrThrow(),
    actPublisher: publicKey,
  })

  await loadedNode.loadRecursively(bee, { actPublisher: publicKey })

  const values = loadedNode.collect()
  const fileNode = values.find(v => v.fullPathString === 'file.txt')

  expect(fileNode).toBeDefined()
  expect(fileNode?.metadata?.['Content-Type']).toBe('text/plain')
  expect(fileNode?.metadata?.['Custom-Header']).toBe('custom-value')
  expect(fileNode?.metadata?.['Filename']).toBe('file.txt')
})
