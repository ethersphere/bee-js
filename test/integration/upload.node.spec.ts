import { MantarayNode } from '../../src'
import { batch, makeBee } from '../utils'

const bee = makeBee()

test('upload files from directory', async () => {
  const expectedHash = '9d851bda0f5d681f8acb81f7e2e26c0e8084be4322e52f0d8152904a4321ae84'

  // use bzz api with streaming tar
  const response = await bee.uploadFilesFromDirectory(batch(), 'test/data')
  expect(response.reference.toHex()).toBe(expectedHash)

  // reconstruct the data with unmarshal
  const unmarshalled = MantarayNode.unmarshal((await bee.downloadData(response.reference)).toUint8Array())
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
