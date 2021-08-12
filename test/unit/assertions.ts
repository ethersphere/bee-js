/* eslint-disable */
import { BeeArgumentError } from '../../src'
import { makeBytes } from '../../src/utils/bytes'

export function testBatchIdAssertion(executor: (input: unknown) => void): void {
  it('should throw exception for bad BatchId', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('')).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Prefixed hexstring is not accepted
    await expect(() => executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )
  })
}

export function testDataAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad Data', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
  })
}

export function testFileDataAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad FileData', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor({ name: 'some file' })).rejects.toThrow(TypeError)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await expect(() => executor({ pipe: () => {} })).rejects.toThrow(TypeError)
  })
}

export function testUploadOptionsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad UploadOptions', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('string')).rejects.toThrow(TypeError)

    await expect(() => executor({ pin: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ pin: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ pin: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ pin: [] })).rejects.toThrow(TypeError)

    await expect(() => executor({ encrypt: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ encrypt: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ encrypt: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ encrypt: [] })).rejects.toThrow(TypeError)

    await expect(() => executor({ tag: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ tag: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ tag: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ tag: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ tag: -1 })).rejects.toThrow(BeeArgumentError)
  })
}

export function testFileUploadOptionsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad FileUploadOptions', async () => {
    await expect(() => executor({ contentType: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ contentType: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ contentType: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ contentType: [] })).rejects.toThrow(TypeError)

    await expect(() => executor({ size: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ size: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ size: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ size: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ size: -1 })).rejects.toThrow(BeeArgumentError)
  })
}

export function testCollectionUploadOptionsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad CollectionUploadOptions', async () => {
    await expect(() => executor({ indexDocument: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ indexDocument: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ indexDocument: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ indexDocument: [] })).rejects.toThrow(TypeError)

    await expect(() => executor({ errorDocument: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ errorDocument: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ errorDocument: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ errorDocument: [] })).rejects.toThrow(TypeError)
  })
}

export function testReferenceAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad Reference', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('')).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Prefixed hexstring is not accepted
    await expect(() => executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )
  })
}

export function testAddressPrefixAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad AddressPrefix', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('')).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Prefixed hexstring is not accepted
    await expect(() => executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Too long hexstring
    await expect(() => executor('123634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      BeeArgumentError,
    )
  })
}

export function testPublicKeyAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad PublicKey', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Prefixed hexstring is not accepted
    await expect(() => executor('0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )
  })
}

export function testPssMessageHandlerAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad PssMessageHandler', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('')).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onMessage() {} })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onMessage() {}, onError: '' })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onMessage() {}, onError: [] })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onMessage() {}, onError: {} })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onMessage() {}, onError: true })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onError() {}, onMessage: true })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onError() {}, onMessage: {} })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onError() {}, onMessage: [] })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onError() {}, onMessage: '' })
    }).rejects.toThrow(TypeError)

    await expect(() => {
      return executor({ onError() {}, onMessage: 1 })
    }).rejects.toThrow(TypeError)
  })
}

export function testTopicAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad Topic', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
  })
}

export function testFeedTopicAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad Topic', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )
  })
}

export function testEthAddressAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad EthAddress', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor(null)).rejects.toThrow(TypeError)
    await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Bytes length mismatch
    await expect(() => executor(makeBytes(19))).rejects.toThrow(TypeError)
  })
}

export function testMakeSignerAssertions(executor: (input: unknown) => void, optionals = true): void {
  it('should throw exception for bad Signer', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)

    if (optionals) {
      await expect(() => executor(null)).rejects.toThrow(TypeError)
      await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    }

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Hex Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Bytes Length mismatch
    await expect(() => executor(makeBytes(31))).rejects.toThrow(TypeError)

    await expect(() => executor({ address: makeBytes(19), sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: '', sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: undefined, sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: null, sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: [], sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: {}, sign: () => {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: makeBytes(20), sign: null })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: makeBytes(20), sign: undefined })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: makeBytes(20), sign: 'asd' })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: makeBytes(20), sign: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ address: makeBytes(20), sign: {} })).rejects.toThrow(TypeError)
  })
}

export function testFeedTypeAssertions(executor: (input: unknown) => void, optionals = true): void {
  it('should throw exception for bad FeedType', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('asd')).rejects.toThrow(TypeError)

    if (optionals) {
      await expect(() => executor('')).rejects.toThrow(TypeError)
      await expect(() => executor(null)).rejects.toThrow(TypeError)
      await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    }
  })
}

export function testAddressAssertions(executor: (input: unknown) => void, optionals = true): void {
  it('should throw exception for bad Address', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor({})).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('asd')).rejects.toThrow(TypeError)

    // Not an valid hexstring (ZZZ)
    await expect(() => executor('ZZZfb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    // Hex Length mismatch
    await expect(() => executor('4fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd')).rejects.toThrow(
      TypeError,
    )

    if (optionals) {
      await expect(() => executor('')).rejects.toThrow(TypeError)
      await expect(() => executor(null)).rejects.toThrow(TypeError)
      await expect(() => executor(undefined)).rejects.toThrow(TypeError)
    }
  })
}
