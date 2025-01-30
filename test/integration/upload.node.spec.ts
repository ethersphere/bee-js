import { MantarayNode } from '../../src'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('upload files from directory', async () => {
  const expectedHash = '237865537469cc454a0d2d8ae913b1402f360af045d956caccf1f1724f597118'

  // use bzz api with streaming tar
  const response = await bee.uploadFilesFromDirectory(batch(), 'test/data')
  expect(response.reference.toHex()).toBe(expectedHash)

  // reconstruct the data with unmarshal
  const unmarshalled = await MantarayNode.unmarshal(bee, response.reference)
  await unmarshalled.loadRecursively(bee)
  expect((await unmarshalled.calculateSelfAddress()).toHex()).toBe(expectedHash)

  // check directory hash locally
  const hash = await bee.hashDirectory('test/data')
  expect(hash.toHex()).toBe(expectedHash)

  // stream chunks to upload
  const streamResponse = await bee.streamDirectory(batch(), 'test/data')
  expect(streamResponse.toHex()).toBe(expectedHash)

  // download the data and compare
  const stylesCss = await bee.downloadFile(expectedHash, 'static/styles.css')
  expect(stylesCss.data.toUtf8()).toBe(`body {
  text-align: center;
}
`)
})
