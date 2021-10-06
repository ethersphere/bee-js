import { Sema } from 'async-sema'

export const blockchainSemaphore = new Sema(1)

type TestFunction = () => Promise<void>

/**
 * Used for tests that make transaction to blockchain and which makes sure only one of these test
 * is run during test execution as Jest runs test in parallel, but Bee allows only one "blockchain" call at the moment.
 *
 * @param fn function that executes the test
 */
export function blockchainSemaphoreWrapper(fn: TestFunction): TestFunction {
  return async () => {
    try {
      await blockchainSemaphore.acquire()
      await fn()
    } finally {
      blockchainSemaphore.release()
    }
  }
}
