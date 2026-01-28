import { batch, makeBee } from '../utils'

const bee = makeBee()

test('abort upload should reject with error', async () => {
  const controller = new AbortController()
  const largeData = 'x'.repeat(1024 * 1024) // 1MB to ensure request takes time

  const uploadPromise = bee.uploadData(batch(), largeData, {}, { signal: controller.signal })

  controller.abort()

  await expect(uploadPromise).rejects.toThrow()
})

test('AbortController signal works with uploadFile', async () => {
  const controller = new AbortController()
  const file = new File(['x'.repeat(1024 * 1024)], 'large.bin')

  const uploadPromise = bee.uploadFile(batch(), file, 'large.bin', {}, { signal: controller.signal })

  controller.abort()

  await expect(uploadPromise).rejects.toThrow()
})

test('non-aborted upload completes successfully', async () => {
  const controller = new AbortController()
  const data = 'Hello, Swarm!'

  const result = await bee.uploadData(batch(), data, {}, { signal: controller.signal })

  expect(result.reference).toBeTruthy()
  expect(result.reference.length).toBeGreaterThan(0)
})
