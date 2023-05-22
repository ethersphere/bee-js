/* eslint-disable */
import { expect } from 'chai'
import { BeeArgumentError, BeeOptions } from '../../src'
import { makeBytes } from '../../src/utils/bytes'

export function testBatchIdAssertion(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad BatchId', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('')).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Prefixed hexstring is not accepted
    await expect(executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)
  })
}

export function testDataAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad Data', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
  })
}

export function testFileDataAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad FileData', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor({ name: 'some file' })).rejectedWith(TypeError)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await expect(executor({ pipe: () => {} })).rejectedWith(TypeError)
  })
}

export function testUploadOptionsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad UploadOptions', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('string')).rejectedWith(TypeError)

    await expect(executor({ pin: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ pin: 1 })).rejectedWith(TypeError)
    await expect(executor({ pin: {} })).rejectedWith(TypeError)
    await expect(executor({ pin: [] })).rejectedWith(TypeError)

    await expect(executor({ encrypt: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ encrypt: 1 })).rejectedWith(TypeError)
    await expect(executor({ encrypt: {} })).rejectedWith(TypeError)
    await expect(executor({ encrypt: [] })).rejectedWith(TypeError)

    await expect(executor({ tag: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ tag: true })).rejectedWith(TypeError)
    await expect(executor({ tag: {} })).rejectedWith(TypeError)
    await expect(executor({ tag: [] })).rejectedWith(TypeError)
    await expect(executor({ tag: -1 })).rejectedWith(BeeArgumentError)
  })
}

export function testRequestOptionsAssertions(
  executor: (input: unknown, beeOptions?: BeeOptions) => void,
  testFetch = true,
): void {
  it('should throw exception for bad RequestOptions', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor(() => {})).rejectedWith(TypeError)
    await expect(executor('string')).rejectedWith(TypeError)

    await expect(executor({ timeout: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ timeout: true })).rejectedWith(TypeError)
    await expect(executor({ timeout: {} })).rejectedWith(TypeError)
    await expect(executor({ timeout: [] })).rejectedWith(TypeError)
    await expect(executor({ timeout: -1 })).rejectedWith(BeeArgumentError)

    await expect(executor({ retry: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ retry: true })).rejectedWith(TypeError)
    await expect(executor({ retry: {} })).rejectedWith(TypeError)
    await expect(executor({ retry: [] })).rejectedWith(TypeError)
    await expect(executor({ retry: -1 })).rejectedWith(BeeArgumentError)
  })
}

export function testPostageBatchOptionsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad PostageBatch', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('string')).rejectedWith(TypeError)

    await expect(executor({ gasPrice: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: true })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: {} })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: [] })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: -1 })).rejectedWith(BeeArgumentError)

    await expect(executor({ immutableFlag: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ immutableFlag: 1 })).rejectedWith(TypeError)
    await expect(executor({ immutableFlag: null })).rejectedWith(TypeError)
    await expect(executor({ immutableFlag: {} })).rejectedWith(TypeError)
    await expect(executor({ immutableFlag: [] })).rejectedWith(TypeError)
  })
}

export function testTransactionOptionsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad TransactionOptions', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('string')).rejectedWith(TypeError)

    await expect(executor({ gasPrice: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: true })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: {} })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: [] })).rejectedWith(TypeError)
    await expect(executor({ gasPrice: -1 })).rejectedWith(BeeArgumentError)

    await expect(executor({ gasLimit: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ gasLimit: true })).rejectedWith(TypeError)
    await expect(executor({ gasLimit: {} })).rejectedWith(TypeError)
    await expect(executor({ gasLimit: [] })).rejectedWith(TypeError)
    await expect(executor({ gasLimit: -1 })).rejectedWith(BeeArgumentError)
  })
}

export function testFileUploadOptionsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad FileUploadOptions', async function () {
    await expect(executor({ contentType: true })).rejectedWith(TypeError)
    await expect(executor({ contentType: 1 })).rejectedWith(TypeError)
    await expect(executor({ contentType: {} })).rejectedWith(TypeError)
    await expect(executor({ contentType: [] })).rejectedWith(TypeError)

    await expect(executor({ size: 'plur' })).rejectedWith(TypeError)
    await expect(executor({ size: true })).rejectedWith(TypeError)
    await expect(executor({ size: {} })).rejectedWith(TypeError)
    await expect(executor({ size: [] })).rejectedWith(TypeError)
    await expect(executor({ size: -1 })).rejectedWith(BeeArgumentError)
  })
}

export function testCollectionUploadOptionsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad CollectionUploadOptions', async function () {
    await expect(executor({ indexDocument: true })).rejectedWith(TypeError)
    await expect(executor({ indexDocument: 1 })).rejectedWith(TypeError)
    await expect(executor({ indexDocument: {} })).rejectedWith(TypeError)
    await expect(executor({ indexDocument: [] })).rejectedWith(TypeError)

    await expect(executor({ errorDocument: true })).rejectedWith(TypeError)
    await expect(executor({ errorDocument: 1 })).rejectedWith(TypeError)
    await expect(executor({ errorDocument: {} })).rejectedWith(TypeError)
    await expect(executor({ errorDocument: [] })).rejectedWith(TypeError)
  })
}

export function testReferenceAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad Reference', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('')).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Prefixed hexstring is not accepted
    await expect(executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)
  })
}

export function testReferenceOrEnsAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad ReferenceOrEns', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Prefixed hexstring is not accepted
    await expect(executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // ENS with invalid characters
    await expect(executor('')).rejectedWith(TypeError)
    await expect(executor('some space.eth')).rejectedWith(TypeError)
    await expect(executor('-example.eth')).rejectedWith(TypeError)
    await expect(executor('http://example.eth')).rejectedWith(TypeError)
  })
}

export function testAddressPrefixAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad AddressPrefix', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('')).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZf')).rejectedWith(TypeError)

    // Prefixed hexstring is not accepted
    await expect(executor('0x634f')).rejectedWith(TypeError)

    // Does not allow longer string then the PSS_TARGET_HEX_LENGTH_MAX
    await expect(executor('1236412')).rejectedWith(BeeArgumentError)
  })
}

export function testPublicKeyAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad PublicKey', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Prefixed hexstring is not accepted
    await expect(executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)
  })
}

export function testPssMessageHandlerAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad PssMessageHandler', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('')).rejectedWith(TypeError)

    await expect(executor({ onMessage() {} })).rejectedWith(TypeError)

    await expect(executor({ onMessage() {}, onError: '' })).rejectedWith(TypeError)

    await expect(executor({ onMessage() {}, onError: [] })).rejectedWith(TypeError)
    await expect(executor({ onMessage() {}, onError: {} })).rejectedWith(TypeError)
    await expect(executor({ onMessage() {}, onError: true })).rejectedWith(TypeError)
    await expect(executor({ onError() {}, onMessage: true })).rejectedWith(TypeError)
    await expect(executor({ onError() {}, onMessage: [] })).rejectedWith(TypeError)
    await expect(executor({ onError() {}, onMessage: {} })).rejectedWith(TypeError)
    await expect(executor({ onError() {}, onMessage: '' })).rejectedWith(TypeError)
    await expect(executor({ onError() {}, onMessage: 1 })).rejectedWith(TypeError)
  })
}

export function testTopicAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad Topic', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
  })
}

export function testFeedTopicAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad Topic', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)
  })
}

export function testEthAddressAssertions(executor: (input: unknown) => Promise<unknown>): void {
  it('should throw exception for bad EthAddress', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor(null)).rejectedWith(TypeError)
    await expect(executor(undefined)).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Bytes length mismatch
    await expect(executor(makeBytes(19))).rejectedWith(TypeError)
  })
}

export function testMakeSignerAssertions(executor: (input: unknown) => Promise<unknown>, optionals = true): void {
  it('should throw exception for bad Signer', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)

    if (optionals) {
      await expect(executor(null)).rejectedWith(TypeError)
      await expect(executor(undefined)).rejectedWith(TypeError)
    }

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Hex Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Bytes Length mismatch
    await expect(executor(makeBytes(31))).rejectedWith(TypeError)

    await expect(executor({ address: makeBytes(19), sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: '', sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: undefined, sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: null, sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: [], sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: {}, sign: () => {} })).rejectedWith(TypeError)
    await expect(executor({ address: makeBytes(20), sign: null })).rejectedWith(TypeError)
    await expect(executor({ address: makeBytes(20), sign: undefined })).rejectedWith(TypeError)
    await expect(executor({ address: makeBytes(20), sign: 'asd' })).rejectedWith(TypeError)
    await expect(executor({ address: makeBytes(20), sign: [] })).rejectedWith(TypeError)
    await expect(executor({ address: makeBytes(20), sign: {} })).rejectedWith(TypeError)
  })
}

export function testFeedTypeAssertions(executor: (input: unknown) => Promise<unknown>, optionals = true): void {
  it('should throw exception for bad FeedType', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('asd')).rejectedWith(TypeError)

    if (optionals) {
      await expect(executor('')).rejectedWith(TypeError)
      await expect(executor(null)).rejectedWith(TypeError)
      await expect(executor(undefined)).rejectedWith(TypeError)
    }
  })
}

export function testAddressAssertions(executor: (input: unknown) => Promise<unknown>, optionals = true): void {
  it('should throw exception for bad Address', async function () {
    await expect(executor(1)).rejectedWith(TypeError)
    await expect(executor(true)).rejectedWith(TypeError)
    await expect(executor({})).rejectedWith(TypeError)
    await expect(executor([])).rejectedWith(TypeError)
    await expect(executor('asd')).rejectedWith(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    // Hex Length mismatch
    await expect(executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejectedWith(TypeError)

    if (optionals) {
      await expect(executor('')).rejectedWith(TypeError)
      await expect(executor(null)).rejectedWith(TypeError)
      await expect(executor(undefined)).rejectedWith(TypeError)
    }
  })
}
