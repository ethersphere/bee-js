import { prepareWebsocketData } from '../../src/utils/data.browser'

test('prepareWebsocketData: string encodes to Uint8Array', async () => {
  const result = await prepareWebsocketData('hello')
  expect(result).toEqual(new TextEncoder().encode('hello'))
})

test('prepareWebsocketData: ArrayBuffer wraps to Uint8Array', async () => {
  const buf = new Uint8Array([1, 2, 3]).buffer
  const result = await prepareWebsocketData(buf)
  expect(result).toEqual(new Uint8Array([1, 2, 3]))
})

test('prepareWebsocketData: Blob reads via Response.arrayBuffer', async () => {
  const blob = new Blob(['world'])
  const result = await prepareWebsocketData(blob)
  expect(result).toEqual(new TextEncoder().encode('world'))
})

test('prepareWebsocketData: Buffer is not handled (browser variant)', async () => {
  // The node variant handles Buffer; the browser variant does not.
  const nodeBuf = Buffer.from('test')
  await expect(prepareWebsocketData(nodeBuf as unknown as ArrayBuffer)).rejects.toThrow(TypeError)
})
