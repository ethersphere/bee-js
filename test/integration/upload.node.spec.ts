import { MantarayNode } from '../../src'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('upload files from directory', async () => {
  const expectedHash = '32c8aa1c32d3ba4ded3dbc6df75d7a3a58b6468c6227fe721af06365f769a8f7'

  // use bzz api with streaming tar
  const response = await bee.collection.uploadFromDirectory(batch(), 'test/data')
  expect(response.reference.toHex()).toBe(expectedHash)

  // reconstruct the data with unmarshal
  const unmarshalled = await MantarayNode.unmarshal(bee, response.reference)
  await unmarshalled.loadRecursively(bee)
  expect((await unmarshalled.calculateSelfAddress()).toHex()).toBe(expectedHash)

  const hash = await bee.collection.hashDirectory('test/data')
  expect(hash.toHex()).toHaveLength(64)

  const streamResponse = await bee.collection.streamFromDirectory(batch(), 'test/data')
  const streamed = await MantarayNode.unmarshal(bee, streamResponse.reference)
  await streamed.loadRecursively(bee)
  expect(streamed.collectAndMap()).toEqual(unmarshalled.collectAndMap())

  // download the data and compare
  const stylesCss = await bee.file.download(expectedHash, 'static/styles.css')
  expect(stylesCss.data.toUtf8()).toBe(`body {
  text-align: center;
}
`)

  const streamedstylesCss = await bee.file.download(streamResponse.reference, 'static/styles.css')
  expect(streamedstylesCss.data.toUtf8()).toBe(`body {
  text-align: center;
}
`)
})

test('stream directory and document metadata', async () => {
  const response = await bee.collection.streamFromDirectory(
    batch(),
    'test/data',
    () => {
      void 0
    },
    {
      indexDocument: 'indexDocument.html',
      errorDocument: 'errorDocument.html',
    },
  )
  const manifest = await MantarayNode.unmarshal(bee, response.reference)
  await manifest.loadRecursively(bee)
  const metadata = manifest.getDocsMetadata()
  expect(metadata.indexDocument).toBe('indexDocument.html')
  expect(metadata.errorDocument).toBe('errorDocument.html')
})
