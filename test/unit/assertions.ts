/* eslint-disable */
import { BeeArgumentError, BeeOptions } from '../../src'
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

export function testRequestOptionsAssertions(
  executor: (input: unknown, beeOptions?: BeeOptions) => void,
  testFetch = true,
): void {
  it('should throw exception for bad RequestOptions', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor(() => {})).rejects.toThrow(TypeError)
    await expect(() => executor('string')).rejects.toThrow(TypeError)

    await expect(() => executor({ timeout: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ timeout: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ timeout: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ timeout: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ timeout: -1 })).rejects.toThrow(BeeArgumentError)

    await expect(() => executor({ retry: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ retry: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ retry: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ retry: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ retry: -1 })).rejects.toThrow(BeeArgumentError)

    await expect(() => executor({ fetch: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ fetch: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ fetch: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ fetch: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ fetch: -1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ fetch: 1 })).rejects.toThrow(TypeError)
  })

  if (testFetch) {
    it('should use per-call request options instead of instance request options', async () => {
      const instanceFetch = jest.fn()
      const instanceMessage = 'instance error'
      const instanceError = { message: instanceMessage }
      instanceFetch.mockRejectedValue(instanceError)
      await expect(() => executor({}, { retry: 0, fetch: instanceFetch })).rejects.toThrow(instanceMessage)
      expect(instanceFetch.mock.calls.length).toEqual(1)

      const callFetch = jest.fn()
      const callMessage = 'call error'
      const callError = { message: callMessage }
      callFetch.mockRejectedValue(callError)
      await expect(() => executor({ fetch: callFetch }, { retry: 0, fetch: instanceFetch })).rejects.toThrow(
        callMessage,
      )
      expect(instanceFetch.mock.calls.length).toEqual(1) // The count did not change from last call
      expect(callFetch.mock.calls.length).toEqual(1)
    })
  }
}

export function testPostageBatchOptionsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad PostageBatch', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('string')).rejects.toThrow(TypeError)

    await expect(() => executor({ gasPrice: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: -1 })).rejects.toThrow(BeeArgumentError)

    await expect(() => executor({ immutableFlag: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ immutableFlag: 1 })).rejects.toThrow(TypeError)
    await expect(() => executor({ immutableFlag: null })).rejects.toThrow(TypeError)
    await expect(() => executor({ immutableFlag: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ immutableFlag: [] })).rejects.toThrow(TypeError)
  })
}

export function testCashoutOptionsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad CashoutOptions', async () => {
    await expect(() => executor(1)).rejects.toThrow(TypeError)
    await expect(() => executor(true)).rejects.toThrow(TypeError)
    await expect(() => executor([])).rejects.toThrow(TypeError)
    await expect(() => executor('string')).rejects.toThrow(TypeError)

    await expect(() => executor({ gasPrice: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasPrice: -1 })).rejects.toThrow(BeeArgumentError)

    await expect(() => executor({ gasLimit: 'plur' })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasLimit: true })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasLimit: {} })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasLimit: [] })).rejects.toThrow(TypeError)
    await expect(() => executor({ gasLimit: -1 })).rejects.toThrow(BeeArgumentError)
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

export function testReferenceOrEnsAssertions(executor: (input: unknown) => void): void {
  it('should throw exception for bad ReferenceOrEns', async () => {
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

    // ENS with invalid characters
    await expect(() => executor('⶿.ß‍.eth')).rejects.toThrow(BeeArgumentError)

    // ENS with invalid characters
    await expect(() => executor('some space.eth')).rejects.toThrow(BeeArgumentError)
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
    await expect(() => executor('ZZZf')).rejects.toThrow(TypeError)

    // Prefixed hexstring is not accepted
    await expect(() => executor('0x634f')).rejects.toThrow(TypeError)

    // Does not allow longer string then the PSS_TARGET_HEX_LENGTH_MAX
    await expect(() => executor('1236412')).rejects.toThrow(BeeArgumentError)
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
