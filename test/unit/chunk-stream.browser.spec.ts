import { Bee } from '../../src'
import { hashDirectory, streamDirectory, streamFiles } from '../../src/utils/chunk-stream.browser'
import { BatchId } from '../../src/utils/typed-bytes'

test('hashDirectory throws in browsers', async () => {
  await expect(hashDirectory('/some/dir')).rejects.toThrow('Hashing directories is not supported in browsers!')
})

test('streamDirectory throws in browsers', async () => {
  await expect(streamDirectory({} as Bee, '/some/dir', new BatchId(new Uint8Array(32)))).rejects.toThrow(
    'Streaming directories is not supported in browsers!',
  )
})

test('streamFiles rejects immediately when signal is already aborted', async () => {
  const controller = new AbortController()
  controller.abort()

  const file = new File(['content'], 'test.txt', { type: 'text/plain' })
  const batchId = new BatchId(new Uint8Array(32))
  const mockBee = { chunk: { upload: jest.fn() } } as unknown as Bee

  await expect(streamFiles(mockBee, [file], batchId, undefined, {}, { signal: controller.signal })).rejects.toThrow(
    'Request aborted',
  )
  expect(mockBee.chunk.upload).not.toHaveBeenCalled()
})

test('streamFiles reads File content via FileReader', async () => {
  const mockBee = {
    chunk: { upload: jest.fn().mockResolvedValue(undefined) },
  } as unknown as Bee

  const content = new Uint8Array(100).fill(42)
  const file = new File([content], 'data.bin')
  const batchId = new BatchId(new Uint8Array(32))

  try {
    await streamFiles(mockBee, [file], batchId)
  } catch {
    // saveRecursively may fail with a minimal bee mock; we only care that
    // FileReader ran and uploadChunk was invoked with the file's chunk data.
  }

  expect(mockBee.chunk.upload).toHaveBeenCalled()
})
