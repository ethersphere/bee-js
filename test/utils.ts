import { Readable } from 'stream'
import { ReadableStream as ReadableStreamPolyfill } from 'web-streams-polyfill'

// @ts-ignore: Needed TS otherwise complains about importing ESM package in CJS even though they are just typings
import type { Options as KyOptions } from 'ky'

import type { Address, BatchId, BeeGenericResponse, PlainBytesReference, PostageBatch, Reference } from '../src/types'
import { bytesToHex, HexString } from '../src/utils/hex'
import { deleteChunkFromLocalStorage } from '../src/modules/debug/chunk'
import { BeeResponseError } from '../src'
import { assertBytes } from '../src/utils/bytes'
import * as stamps from '../src/modules/debug/stamps'
import { sleep } from '../src/utils/sleep'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeHashReference(): R
      toBeBeeResponse(expectedStatusCode: number): R
      toBeOneOf(el: unknown[]): R
      toBeType(type: string): R
      toBeNumberString(): R
    }
  }
}

/**
 * Load common own Jest Matchers which can be used to check particular return values.
 */
export function commonMatchers(): void {
  // expect.extend({
  //   toBeHashReference(received: string) {
  //     const result = {
  //       pass: false,
  //       message: () => 'Given input is not a Swarm hash reference',
  //     }
  //
  //     if (typeof received === 'string' && /^[0-9a-fA-F]{64}$/.test(received)) {
  //       result.pass = true
  //       result.message = () => 'Given string is semantically valid Swarm hash reference'
  //     }
  //
  //     return result
  //   },
  //   toBeBeeResponse(received: BeeGenericResponse, expectedStatusCode: number) {
  //     const result = {
  //       pass: false,
  //       message: () =>
  //         `Bee response does not have status code ${expectedStatusCode}. Got: ${received.code}\nResponse message: ${received.message}`,
  //     }
  //
  //     if (received.code === expectedStatusCode) {
  //       result.pass = true
  //       result.message = () => 'Bee response meets with its requirements'
  //     }
  //
  //     return result
  //   },
  //   toBeType(received, argument) {
  //     const initialType = typeof received
  //     const isArray = Array.isArray(received) ? 'array' : initialType
  //     const type = initialType === 'object' ? isArray : initialType
  //
  //     return type === argument
  //       ? {
  //           message: () => `expected ${received} to be type ${argument}`,
  //           pass: true,
  //         }
  //       : {
  //           message: () => `expected ${received} to be type ${argument}`,
  //           pass: false,
  //         }
  //   },
  //   toBeNumberString(received) {
  //     const message = () => `expected ${received} to be a number in a string type`
  //
  //     return /^-?(0|[1-9][0-9]*)$/g.test(received)
  //       ? {
  //           message,
  //           pass: true,
  //         }
  //       : {
  //           message,
  //           pass: false,
  //         }
  //   },
  // })
}

/**
 * Helper function that reads whole content of ReadableStream
 * @param stream
 */
export async function readWholeUint8ArrayReadableStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  let buff: number[] = []
  let readResult: ReadableStreamReadResult<Uint8Array>

  do {
    readResult = await reader.read()

    if (readResult.value) buff = [...buff, ...readResult.value]
  } while (!readResult.done)

  return new Uint8Array(buff)
}

export function createRandomNodeReadable(totalSize: number, chunkSize = 1000): Readable {
  if (totalSize % chunkSize !== 0) {
    throw new Error(`totalSize ${totalSize} is not dividable without remainder by chunkSize ${chunkSize}`)
  }

  const stream = new Readable()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  stream._read = (): void => {}

  for (let i = 0; i < totalSize / chunkSize; i++) {
    stream.push(randomByteArray(chunkSize))
  }

  stream.push(null)

  return stream
}

export function createReadableStream(iterable: Iterable<Uint8Array>): ReadableStream {
  const iter = iterable[Symbol.iterator]()

  return new ReadableStreamPolyfill({
    async pull(controller) {
      const result = iter.next()

      if (result.done) {
        controller.close()

        return
      }

      controller.enqueue(result.value)
    },
  }) as ReadableStream
}

/**
 * Lehmer random number generator with seed (minstd_rand in C++11)
 * !!! Very fast but not well distributed pseudo-random function !!!
 *
 * @param seed Seed for the pseudo-random generator
 */
function lrng(seed: number): () => number {
  return (): number => ((2 ** 31 - 1) & (seed = Math.imul(48271, seed))) / 2 ** 31
}

/**
 * Utility function for generating random Buffer
 * !!! IT IS NOT CRYPTO SAFE !!!
 * For that use `crypto.randomBytes()`
 *
 * @param length Number of bytes to generate
 * @param seed Seed for the pseudo-random generator
 */
export function randomByteArray(length: number, seed = 500): Uint8Array {
  const rand = lrng(seed)
  const buf = new Uint8Array(length)

  for (let i = 0; i < length; ++i) {
    buf[i] = (rand() * 0xff) << 0
  }

  return buf
}

/**
 * Returns a url for testing the Bee public API
 */
export function beeUrl(): string {
  return process.env.BEE_API_URL || 'http://127.0.0.1:1633'
}

export function beeKyOptions(): KyOptions {
  return { prefixUrl: beeUrl(), timeout: false }
}

/**
 * Returns a url of another peer for testing the Bee public API
 */
export function beePeerUrl(): string {
  return process.env.BEE_PEER_API_URL || 'http://127.0.0.1:11633'
}

export function beePeerKyOptions(): KyOptions {
  return { prefixUrl: beePeerUrl(), timeout: false }
}

/**
 * Helper function that create monster batch for all the tests.
 * There is semaphore mechanism that allows only creation of one batch across all the
 * parallel running tests that have to wait until it is created.
 */
export function getPostageBatch(url = beeDebugUrl()): BatchId {
  let stamp: BatchId

  switch (url) {
    case beeDebugUrl():
      stamp = process.env.BEE_POSTAGE as BatchId
      break
    case beePeerDebugUrl():
      stamp = process.env.BEE_PEER_POSTAGE as BatchId
      break
    default:
      throw new Error('Unknown URL ' + url)
  }

  if (!stamp) {
    throw new Error('There is no postage stamp configured for URL ' + url)
  }

  return stamp
}

/**
 * Returns a url for testing the Bee Debug API
 */
export function beeDebugUrl(): string {
  return process.env.BEE_DEBUG_API_URL || 'http://127.0.0.1:1635'
}

export function beeDebugKyOptions(): KyOptions {
  return { prefixUrl: beeDebugUrl(), timeout: false }
}

/**
 * Returns a url for testing the Bee Debug API
 */
export function beePeerDebugUrl(): string {
  return process.env.BEE_PEER_DEBUG_API_URL || 'http://127.0.0.1:11635'
}

export function beePeerDebugKyOptions(): KyOptions {
  return { prefixUrl: beePeerDebugUrl(), timeout: false }
}

/**
 * Try to delete a chunk from local storage, ignoring all errors
 *
 * @param address  Swarm address of chunk
 */
export async function tryDeleteChunkFromLocalStorage(address: string | PlainBytesReference): Promise<void> {
  if (typeof address !== 'string') {
    assertBytes(address, 32)
    address = bytesToHex(address)
  }

  try {
    await deleteChunkFromLocalStorage(beeDebugKyOptions(), address)
  } catch (e) {
    // ignore not found errors
    if (e instanceof BeeResponseError && e.status === 404) {
      return
    }
    throw e
  }
}

/**
 * Formatting utility for displaying long strings like hexstrings.
 *
 * @param inputStr
 * @param len
 */
export function shorten(inputStr: unknown, len = 17): string {
  const str = typeof inputStr === 'string' ? inputStr : (inputStr as string).toString()

  if (str.length <= len) {
    return str
  }

  return `${str.slice(0, 6)}...${str.slice(-6)} (length: ${str.length})`
}

async function timeout(ms: number, message = 'Execution reached timeout!'): Promise<Error> {
  await sleep(ms)
  throw new Error(message)
}

export async function waitForBatchToBeUsable(batchId: string, pollingInterval = 200): Promise<void> {
  await Promise.race([
    timeout(USABLE_TIMEOUT, 'Awaiting of usable postage batch timed out!'),
    async () => {
      let stamp

      do {
        await sleep(pollingInterval)
        stamp = await stamps.getPostageBatch(beeDebugKyOptions(), batchId as BatchId)
      } while (!stamp.usable)
    },
  ])
}

const DEFAULT_BATCH_AMOUNT = '1'
const DEFAULT_BATCH_DEPTH = 17

/**
 * Returns already existing batch or will create one.
 *
 * If some specification is passed then it is guaranteed that the batch will have this property(ies)
 *
 * @param amount
 * @param depth
 * @param immutable
 */
export async function getOrCreatePostageBatch(
  amount?: string,
  depth?: number,
  immutable?: boolean,
): Promise<PostageBatch> {
  // Non-usable stamps are ignored by Bee
  const allUsableStamps = (await stamps.getAllPostageBatches(beeDebugKyOptions())).filter(stamp => stamp.usable)

  if (allUsableStamps.length === 0) {
    const batchId = await stamps.createPostageBatch(
      beeDebugKyOptions(),
      amount ?? DEFAULT_BATCH_AMOUNT,
      depth ?? DEFAULT_BATCH_DEPTH,
    )

    await waitForBatchToBeUsable(batchId)

    return stamps.getPostageBatch(beeDebugKyOptions(), batchId)
  }

  // User does not want any specific batch, lets give him the first one
  if (amount === undefined && depth === undefined && immutable === undefined) {
    return allUsableStamps[0]
  }

  // User wants some specific batch
  for (const stamp of allUsableStamps) {
    let meetingAllCriteria = false

    if (amount !== undefined) {
      meetingAllCriteria = amount === stamp.amount
    } else {
      meetingAllCriteria = true
    }

    if (depth !== undefined) {
      meetingAllCriteria = meetingAllCriteria && depth === stamp.depth
    }

    if (immutable !== undefined) {
      meetingAllCriteria = meetingAllCriteria && immutable === stamp.immutableFlag
    }

    if (meetingAllCriteria) {
      return stamp
    }
  }

  // No stamp meeting the criteria was found ==> we need to create a new one
  const batchId = await stamps.createPostageBatch(
    beeDebugKyOptions(),
    amount ?? DEFAULT_BATCH_AMOUNT,
    depth ?? DEFAULT_BATCH_DEPTH,
  )

  await waitForBatchToBeUsable(batchId)

  return stamps.getPostageBatch(beeDebugKyOptions(), batchId)
}

export function makeTestTarget(target: string): string {
  return target.slice(0, 2)
}

export const invalidReference = '0000000000000000000000000000000000000000000000000000000000000000' as Reference

export const okResponse: BeeGenericResponse = {
  code: 200,
  message: 'OK',
}

export const createdResponse: BeeGenericResponse = {
  code: 201,
  message: 'Created',
}

const USABLE_TIMEOUT = 7_000
export const ERR_TIMEOUT = 40_000
export const BIG_FILE_TIMEOUT = 100_000
export const PSS_TIMEOUT = 120_000
export const FEED_TIMEOUT = 120_000
export const BLOCKCHAIN_TRANSACTION_TIMEOUT = 40_000
export const WAITING_USABLE_STAMP_TIMEOUT = 130_000

export const testChunkPayload = new Uint8Array([1, 2, 3])
// span is the payload length encoded as uint64 little endian
export const testChunkSpan = new Uint8Array([testChunkPayload.length, 0, 0, 0, 0, 0, 0, 0])
export const testChunkData = new Uint8Array([...testChunkSpan, ...testChunkPayload])
// the hash is hardcoded because we would need the bmt hasher otherwise
export const testChunkHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as Reference
export const testChunkEncryptedReference =
  'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as Reference
export const testAddress = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as Address
export const testBatchId = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as BatchId

export const testJsonPayload = [{ some: 'object' }]
export const testJsonStringPayload = JSON.stringify(testJsonPayload)
export const testJsonHash = '872a858115b8bee4408b1427b49e472883fdc2512d5a8f2d428b97ecc8f7ccfa'
export const testJsonCid = 'bah5acgzaq4vilaivxc7oiqelcqt3jhshfcb73qsrfvni6lkcrol6zshxzt5a'
export const testJsonEns = 'testing.eth'

export const testIdentity = {
  privateKey: '634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' as HexString,
  publicKey: '03c32bb011339667a487b6c1c35061f15f7edc36aa9a0f8648aba07a4b8bd741b4' as HexString,
  address: '8d3766440f0d7b949a5e32995d09619a7f86e632' as HexString,
}
