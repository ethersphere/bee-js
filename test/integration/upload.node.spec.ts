import { MantarayNode } from '../../src'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('upload files from directory', async () => {
  const expectedHash = '32c8aa1c32d3ba4ded3dbc6df75d7a3a58b6468c6227fe721af06365f769a8f7'
  const expectedStreamHash = '237865537469cc454a0d2d8ae913b1402f360af045d956caccf1f1724f597118'

  // use bzz api with streaming tar
  const response = await bee.upload.filesFromDirectory(batch(), 'test/data')
  expect(response.reference.toHex()).toBe(expectedHash)

  // reconstruct the data with unmarshal
  const unmarshalled = await MantarayNode.unmarshal(bee, response.reference)
  await unmarshalled.loadRecursively(bee)
  expect((await unmarshalled.calculateSelfAddress()).toHex()).toBe(expectedHash)

  // check directory hash locally
  const hash = await bee.upload.hashDirectory('test/data')
  expect(hash.toHex()).toBe(expectedStreamHash)

  // stream chunks to upload
  const streamResponse = await bee.upload.streamDirectory(batch(), 'test/data')
  expect(streamResponse.reference.toHex()).toBe(expectedStreamHash)

  // download the data and compare
  const stylesCss = await bee.download.file(expectedHash, 'static/styles.css')
  expect(stylesCss.data.toUtf8()).toBe(`body {
  text-align: center;
}
`)

  const streamedstylesCss = await bee.download.file(expectedStreamHash, 'static/styles.css')
  expect(streamedstylesCss.data.toUtf8()).toBe(`body {
  text-align: center;
}
`)
})

test('stream directory and document metadata', async () => {
  const response = await bee.upload.streamDirectory(
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
