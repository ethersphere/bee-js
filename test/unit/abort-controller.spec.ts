import { prepareBeeRequestOptions } from '../../src/utils/type'

test('prepareBeeRequestOptions should preserve signal', () => {
  const controller = new AbortController()
  const options = prepareBeeRequestOptions({
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

  const options = prepareBeeRequestOptions({
    signal: controller.signal,
  })

  expect(options.signal).toBe(controller.signal)
  expect(options.signal?.aborted).toBe(true)
})

test('prepareBeeRequestOptions should work without signal', () => {
  const options = prepareBeeRequestOptions({
    timeout: 3000,
    endlesslyRetry: true,
  })

  expect(options.signal).toBeUndefined()
  expect(options.timeout).toBe(3000)
  expect(options.endlesslyRetry).toBe(true)
})
