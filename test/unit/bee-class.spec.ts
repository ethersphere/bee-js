import { assertAllIsDone, createPostageBatchMock, downloadDataMock, fetchFeedUpdateMock, MOCK_SERVER_URL } from './nock'
import {
  BatchId,
  Bee,
  BeeArgumentError,
  CollectionUploadOptions,
  PssMessageHandler,
  ReferenceResponse,
  UploadOptions,
} from '../../src'
import { testBatchId, testIdentity, testJsonHash, testJsonPayload, testJsonStringPayload } from '../utils'
import { makeTopicFromString } from '../../src/feed/topic'
import {
  testAddressPrefixAssertions,
  testBatchIdAssertion,
  testCollectionUploadOptionsAssertions,
  testDataAssertions,
  testFileDataAssertions,
  testFileUploadOptionsAssertions,
  testPssMessageHandlerAssertions,
  testPublicKeyAssertions,
  testReferenceAssertions,
  testTopicAssertions,
  testUploadOptionsAssertions,
  testFeedTypeAssertions,
  testFeedTopicAssertions,
  testEthAddressAssertions,
  testMakeSignerAssertions,
} from './assertions'
import { FeedType } from '../../src/feed/type'

const TOPIC = 'some=very%nice#topic'
const HASHED_TOPIC = makeTopicFromString(TOPIC)

describe('Bee class', () => {
  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, () => {
      try {
        new Bee(url as string)
        fail('Bee constructor should have thrown error.')
      } catch (e) {
        if (e instanceof BeeArgumentError) {
          expect(e.value).toEqual(url)

          return
        }

        throw e
      }
    })
  }

  testUrl('')
  testUrl(null)
  testUrl(undefined)
  testUrl(1)
  testUrl('some-invalid-url')
  testUrl('invalid:protocol')
  // eslint-disable-next-line no-script-url
  testUrl('javascript:console.log()')
  testUrl('ws://localhost:1633')

  describe('uploadData', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(input as BatchId, '')
    })

    testDataAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(testBatchId, input as string)
    })

    testUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(testBatchId, '', input as UploadOptions)
    })
  })

  describe('downloadData', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadData(input as string)
    })
  })

  describe('downloadReadableData', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableData(input as string)
    })
  })

  describe('uploadFile', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(input as BatchId, '')
    })

    testFileDataAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(testBatchId, input as string)
    })

    testUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(testBatchId, '', undefined, input as UploadOptions)
    })

    testFileUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(testBatchId, '', undefined, input as UploadOptions)
    })
  })

  describe('downloadFile', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadFile(input as string)
    })
  })

  describe('downloadReadableFile', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableFile(input as string)
    })
  })

  describe('uploadFiles', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const files = [{ name: 'some name', arrayBuffer() {} }] as File[]

    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFiles(input as BatchId, files)
    })

    testUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFiles(testBatchId, files, input as UploadOptions)
    })

    testCollectionUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFiles(testBatchId, files, input as UploadOptions)
    })
  })

  describe('uploadFilesFromDirectory', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFilesFromDirectory(input as BatchId, 'some path')
    })

    testUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFilesFromDirectory(testBatchId, 'some path', input as CollectionUploadOptions)
    })

    testCollectionUploadOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFilesFromDirectory(testBatchId, 'some path', input as CollectionUploadOptions)
    })

    it('should throw exception for bad Dir', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadFilesFromDirectory(testBatchId, '')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, 1)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, [])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, {})).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, null)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, undefined)).rejects.toThrow(TypeError)
    })
  })

  describe('retrieveTag', () => {
    it('should throw exception for bad Tag', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadFilesFromDirectory(testBatchId, '')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, -1)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, [])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, {})).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, null)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, undefined)).rejects.toThrow(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, { total: 'asd' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, { total: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, { total: null })).rejects.toThrow(TypeError)
    })
  })

  describe('pin', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pin(input as string)
    })
  })

  describe('unpin', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.unpin(input as string)
    })
  })

  describe('getPin', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPin(input as string)
    })
  })

  describe('reuploadPinnedData', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.reuploadPinnedData(input as string)
    })
  })

  describe('pssSend', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend(input as BatchId, 'topic', '123', 'data')
    })

    testDataAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend(testBatchId, 'topic', '123', input as string)
    })

    testAddressPrefixAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend(testBatchId, 'topic', input as string, '123')
    })

    testPublicKeyAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend(testBatchId, 'topic', '123', 'data', input as string)
    })

    testTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend(testBatchId, input as string, '123', 'data')
    })
  })

  describe('pssSubscribe', () => {
    testPssMessageHandlerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSubscribe('topic', input as PssMessageHandler)
    })

    testTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)
      const handler = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onMessage() {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onError() {},
      }

      return bee.pssSubscribe(input as string, handler)
    })
  })

  describe('pssReceive', () => {
    testTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssReceive(input as string)
    })

    it('should throw exception for bad Timeout', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', 'asd')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', [])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', {})).rejects.toThrow(TypeError)
    })
  })

  describe('createFeedManifest', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createFeedManifest(input as BatchId, 'epoch', '123', testIdentity.address)
    })

    testFeedTypeAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createFeedManifest(testBatchId, input as FeedType, '123', testIdentity.address)
    })

    testFeedTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createFeedManifest(testBatchId, 'epoch', input as string, testIdentity.address)
    })

    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createFeedManifest(testBatchId, 'epoch', '123', input as string)
    })
  })

  describe('makeFeedReader', () => {
    testFeedTypeAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedReader(input as FeedType, '123', testIdentity.address)
    })

    testFeedTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedReader('epoch', input as string, testIdentity.address)
    })

    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedReader('epoch', '123', input as string)
    })
  })

  describe('makeFeedWriter', () => {
    testFeedTypeAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedWriter(input as FeedType, '123', testIdentity.privateKey)
    })

    testFeedTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedWriter('epoch', input as string, testIdentity.privateKey)
    })

    testMakeSignerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedWriter('epoch', '123', input as string)
    })
  })

  describe('setJsonFeed', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.setJsonFeed(input as BatchId, 'epoch', '123', { signer: testIdentity.privateKey })
    })

    testFeedTypeAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.setJsonFeed(testBatchId, '123', 'data', { type: input as FeedType, signer: testIdentity.privateKey })
    }, false)

    testTopicAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.setJsonFeed('epoch', input as string, 'data', { signer: testIdentity.privateKey })
    })

    testMakeSignerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.setJsonFeed('epoch', '123', 'data', { signer: input as string })
    })
  })

  describe('getJsonFeed', () => {
    it('should fetch with specified address', async () => {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).toEqual(testJsonPayload)

      assertAllIsDone()
    })

    it('should fetch with specified signer private key', async () => {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).toEqual(testJsonPayload)

      assertAllIsDone()
    })

    it('should fetch with default instance signer', async () => {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, { signer: testIdentity.privateKey })
      const json = await bee.getJsonFeed(TOPIC)
      expect(json).toEqual(testJsonPayload)

      assertAllIsDone()
    })

    it('should prioritize address option over default instance signer', async () => {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).toEqual(testJsonPayload)

      assertAllIsDone()
    })

    it('should prioritize signer option over default instance signer', async () => {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).toEqual(testJsonPayload)

      assertAllIsDone()
    })

    it('should fail when both signer and address options are specified', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(
        bee.getJsonFeed(TOPIC, { address: testIdentity.address, signer: testIdentity.privateKey }),
      ).rejects.toThrow()
    })

    it('should fail if no signer or address is specified', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.getJsonFeed(TOPIC)).rejects.toThrow()
    })
  })

  describe('makeSOCReader', () => {
    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCReader(input as string)
    })
  })

  describe('makeSOCWriter', () => {
    testMakeSignerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCWriter(input as string)
    }, false)
  })

  describe('createPostageBatch', () => {
    const BATCH_ID = '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
    const BATCH_RESPONSE = {
      batchID: BATCH_ID,
    }

    it('should not pass headers if no gas price is specified', async () => {
      createPostageBatchMock('10', '17').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch(BigInt('10'), 17)).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      createPostageBatchMock('10', '17', '100').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: BigInt('100') })).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: BigInt('-1') })).rejects.toThrow(
        BeeArgumentError,
      )
    })

    it('should throw error if too small depth', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch(BigInt('10'), -1)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch(BigInt('10'), 15)).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if too big depth', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch(BigInt('10'), 256)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getPostageBatch', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPostageBatch(input as BatchId)
    })
  })
})
