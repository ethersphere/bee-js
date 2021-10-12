import { Sema } from 'async-sema'
import { BLOCKCHAIN_TRANSACTION_TIMEOUT, sleep } from './utils'

export const blockchainSemaphore = new Sema(1)

type TestFunction = () => Promise<void>

async function timeout(ms: number): Promise<Error> {
  await sleep(ms)
  throw new Error('Execution of tests reached timeout!')
}

/**
 * Function used for tests that make transaction to blockchain.
 * It makes sure that all blockchain-related tests run serially as Jest executes test in parallel,
 * but Bee allows only one blockchain API call at the moment.
 *
 * @param fn function that executes the test
 * @param timeoutMs Timeout that is measured for the test execution and not the time the tests awaits for being run. By default set for timeout of one blockchain transaction.
 */
export function blockchainSemaphoreWrapper(fn: TestFunction, timeoutMs = BLOCKCHAIN_TRANSACTION_TIMEOUT): TestFunction {
  return async () => {
    try {
      await blockchainSemaphore.acquire()
      await Promise.race([fn(), timeout(timeoutMs)])
    } finally {
      blockchainSemaphore.release()
    }
  }
}
