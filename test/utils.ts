import { Readable } from 'stream'
import type { BeeResponse } from '../src/types'
import { bytesToHex, HexString } from '../src/utils/hex'
import { deleteChunkFromLocalStorage } from '../src/modules/debug/chunk'
import { BeeResponseError } from '../src'
import { ChunkAddress } from '../src/chunk/cac'
import { assertBytes } from '../src/utils/bytes'

/**
 * Load common own Jest Matchers which can be used to check particular return values.
 */
export function commonMatchers(): void {
  expect.extend({
    toBeHashReference(received: string) {
      const result = {
        pass: false,
        message: () => 'Given input is not a Swarm hash reference',
      }

      if (typeof received === 'string' && /^[0-9a-fA-F]{64}$/.test(received)) {
        result.pass = true
        result.message = () => 'Given string is semantically valid Swarm hash reference'
      }

      return result
    },
    toBeBeeResponse(received: BeeResponse, expectedStatusCode: number) {
      const result = {
        pass: false,
        message: () =>
          `Bee response does not have status code ${expectedStatusCode}. Got: ${received.code}\nResponse message: ${received.message}`,
      }

      if (received.code === expectedStatusCode) {
        result.pass = true
        result.message = () => 'Bee response meets with its requirements'
      }

      return result
    },
  })
}

/**
 * Sleep for N miliseconds
 *
 * @param ms Number of miliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function createReadable(input: string | Uint8Array): Readable {
  const stream = new Readable()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  stream._read = (): void => {}
  stream.push(Buffer.from(input))
  stream.push(null)

  return stream
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
  return process.env.BEE_API_URL || 'http://bee-0.localhost'
}

/**
 * Returns a url of another peer for testing the Bee public API
 */
export function beePeerUrl(): string {
  return process.env.BEE_PEER_API_URL || 'http://bee-1.localhost'
}

/**
 * Returns a url for testing the Bee Debug API
 */
export function beeDebugUrl(url: string = beeUrl()): string {
  const regexp = /http:\/\/bee-(\d).localhost/

  if (url.match(regexp)) {
    return url.replace(regexp, 'http://bee-$1-debug.localhost')
  }
  const urlObj = new URL(url)
  const port = urlObj.port ? parseInt(urlObj.port, 10) + 2 : 1635

  return urlObj.protocol + '//' + urlObj.hostname + ':' + port
}

/**
 * Try to delete a chunk from local storage, ignoring all errors
 *
 * @param address  Swarm address of chunk
 */
export async function tryDeleteChunkFromLocalStorage(address: string | ChunkAddress): Promise<void> {
  if (typeof address !== 'string') {
    assertBytes(address, 32)
    address = bytesToHex(address)
  }

  try {
    await deleteChunkFromLocalStorage(beeDebugUrl(), address)
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
 * @param str
 * @param len
 */
export function shorten(inputStr: unknown, len = 17): string {
  const str = typeof inputStr === 'string' ? inputStr : (inputStr as string).toString()

  if (str.length <= len) {
    return str
  }

  return `${str.slice(0, 6)}...${str.slice(-6)} (length: ${str.length})`
}

export const invalidReference = '0000000000000000000000000000000000000000000000000000000000000000'

export const okResponse: BeeResponse = {
  code: 200,
  message: 'OK',
}

export const ERR_TIMEOUT = 40000
export const BIG_FILE_TIMEOUT = 100000
export const PSS_TIMEOUT = 120000
export const FEED_TIMEOUT = 120000

export const testChunkPayload = new Uint8Array([1, 2, 3])
// span is the payload length encoded as uint64 little endian
export const testChunkSpan = new Uint8Array([testChunkPayload.length, 0, 0, 0, 0, 0, 0, 0])
export const testChunkData = new Uint8Array([...testChunkSpan, ...testChunkPayload])
// the hash is hardcoded because we would need the bmt hasher otherwise
export const testChunkHash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338' as HexString

export const testIdentity = {
  privateKey: '634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' as HexString,
  publicKey: '03c32bb011339667a487b6c1c35061f15f7edc36aa9a0f8648aba07a4b8bd741b4' as HexString,
  address: '8d3766440f0d7b949a5e32995d09619a7f86e632' as HexString,
}
