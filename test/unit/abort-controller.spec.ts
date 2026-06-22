import { BeeRequestOptionsSchema } from '../../src/utils/schema'

test('BeeRequestOptionsSchema.parse should preserve signal', () => {
  const controller = new AbortController()
  const options = BeeRequestOptionsSchema.parse({
    signal: controller.signal,
    timeout: 5000,
  })

  expect(options.signal).toBe(controller.signal)
  expect(options.signal?.aborted).toBe(false)
  expect(options.timeout).toBe(5000)
})

test('prepareBeeRequestOptions should preserve aborted signal', () => {
  const controller = new AbortController()
  controller.abort()

  const options = BeeRequestOptionsSchema.parse({
    signal: controller.signal,
  })

  expect(options.signal).toBe(controller.signal)
  expect(options.signal?.aborted).toBe(true)
})

test('prepareBeeRequestOptions should work without signal', () => {
  const options = BeeRequestOptionsSchema.parse({
    timeout: 3000,
    endlesslyRetry: true,
  })

  expect(options.signal).toBeUndefined()
  expect(options.timeout).toBe(3000)
  expect(options.endlesslyRetry).toBe(true)
})
