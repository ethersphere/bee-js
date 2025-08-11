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
