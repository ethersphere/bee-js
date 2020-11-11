import { Readable } from 'stream';

/**
 * Sleep for N miliseconds and return any args past
 *
 * @param ms Number of miliseconds to sleep
 * @param args Values to be returned
 */
export function sleep<T>(ms: number, ...args: T[]): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(...args), ms));
}

export function createReadable(input: string): Readable {
  const stream = new Readable();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  stream._read = (): void => {};
  stream.push(Buffer.from(input));
  stream.push(null);

  return stream;
}

/**
 * Utility function for generating random Buffer
 * !!! IT IS NOT CRYPTO SAFE !!!
 * For that use `crypto.randomBytes()`
 *
 * @param length
 */
export function randomBuffer(length: number): Buffer {
  const buf = Buffer.alloc(length);

  for (let i = 0; i < length; ++i) {
    buf[i] = (Math.random() * 0xff) << 0;
  }

  return buf;
}
