import { Readable } from 'stream'
import type { BeeResponse } from '../src/types'

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
  return process.env.BEE_URL || 'http://bee-0.localhost'
}

/**
 * Returns a url of another peer for testing the Bee public API
 */
export function beePeerUrl(): string {
  return process.env.BEE_PEER_URL || 'http://bee-1.localhost'
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

export const invalidReference = '0000000000000000000000000000000000000000000000000000000000000000'

export const okResponse: BeeResponse = {
  code: 200,
  message: 'OK',
}
export const PSS_TIMEOUT = 60000
