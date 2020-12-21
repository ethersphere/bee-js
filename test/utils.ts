import { Readable } from 'stream'

/**
 * Sleep for N miliseconds and return any args past
 *
 * @param ms Number of miliseconds to sleep
 * @param args Values to be returned
 */
export function sleep<T>(ms: number, ...args: T[]): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(...args), ms))
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

export function beeUrl(): string {
  return process.env.BEE_URL || 'http://bee-0.localhost'
}

export function beePeerUrl(): string {
  return process.env.BEE_PEER_URL || 'http://bee-1.localhost'
}

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

export const okResponse = {
  code: 200,
  message: 'OK',
}
