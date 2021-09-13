import {
  assertAllIsDone,
  createPostageBatchMock,
  downloadDataMock,
  fetchFeedUpdateMock,
  MOCK_SERVER_URL,
  uploadFileMock,
} from './nock'
import {
  BatchId,
  Bee,
  BeeArgumentError,
  CollectionUploadOptions,
  PssMessageHandler,
  ReferenceResponse,
  UploadOptions,
  RequestOptions,
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
  testRequestOptionsAssertions,
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

  it('should set default headers and use them if specified', async () => {
    const defaultHeaders = { 'X-Awesome-Header': '123' }
    uploadFileMock(testBatchId, 'nice.txt', {}, defaultHeaders).reply(200, {
      reference: testJsonHash,
    } as ReferenceResponse)

    const bee = new Bee(MOCK_SERVER_URL, { defaultHeaders })
    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt')

    expect(reference).toEqual({
      reference: testJsonHash,
      tagUid: 123,
    })
  })

  describe('uploadData', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(testBatchId, '', input as RequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadData('', input as RequestOptions)
    })
  })

  describe('downloadReadableData', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableData(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableData('', input as RequestOptions)
    })
  })

  describe('uploadFile', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(testBatchId, '', undefined, input as RequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadFile('', '', input as RequestOptions)
    })
  })

  describe('downloadReadableFile', () => {
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableFile(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableFile('', '', input as RequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFiles(testBatchId, files, input as RequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFilesFromDirectory(testBatchId, 'some path', input as RequestOptions)
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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.retrieveTag(0, input as RequestOptions)
    })

    it('should throw exception for bad Tag', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.retrieveTag('')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag([])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({})).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(null)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(undefined)).rejects.toThrow(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: 'asdf' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: null })).rejects.toThrow(TypeError)

      await expect(bee.retrieveTag(-1)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('deleteTag', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.deleteTag(0, input as RequestOptions)
    })

    it('should throw exception for bad Tag', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.deleteTag('')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag([])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({})).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(null)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(undefined)).rejects.toThrow(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: 'asdf' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: null })).rejects.toThrow(TypeError)

      await expect(bee.deleteTag(-1)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getAllTags', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getAllTags(input as RequestOptions)
    })

    it('should throw exception for bad options', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags('')).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(true)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(-1)).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags([])).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(null)).rejects.toThrow(TypeError)
    })

    it('should throw exception for bad limit', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: '' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: [] })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: {} })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: null })).rejects.toThrow(TypeError)

      await expect(bee.getAllTags({ limit: -1 })).rejects.toThrow(BeeArgumentError)
      await expect(bee.getAllTags({ limit: Number.MAX_VALUE })).rejects.toThrow(BeeArgumentError)
    })

    it('should throw exception for bad offset', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: '' })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: true })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: [] })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: {} })).rejects.toThrow(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: null })).rejects.toThrow(TypeError)

      await expect(bee.getAllTags({ offset: -1 })).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('pin', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pin('', input as RequestOptions)
    })

    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pin(input as string)
    })
  })

  describe('unpin', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.unpin('', input as RequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.unpin(input as string)
    })
  })

  describe('getPin', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPin('', input as RequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPin(input as string)
    })
  })

  describe('reuploadPinnedData', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.reuploadPinnedData('', input as RequestOptions)
    })

    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.reuploadPinnedData(input as string)
    })
  })

  describe('pssSend', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pssSend('', 'topic', '123', 'data', '', input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.createFeedManifest(testBatchId, 'epoch', '123', testIdentity.address, input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedReader('epoch', '123', testIdentity.address, input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeFeedWriter('epoch', '123', testIdentity.address, input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.setJsonFeed(testBatchId, 'epoch', '123', input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getJsonFeed(TOPIC, input as RequestOptions)
    })

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
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCReader(testIdentity.address, input as RequestOptions)
    })

    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCReader(input as string)
    })
  })

  describe('makeSOCWriter', () => {
    testRequestOptionsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCWriter(testIdentity.address, input as RequestOptions)
    })

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
      await expect(bee.createPostageBatch('10', 17)).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if gas price is specified', async () => {
      createPostageBatchMock('10', '17', '100').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { gasPrice: '100' })).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should pass headers if immutable flag is specified', async () => {
      createPostageBatchMock('10', '17', undefined, undefined, 'true').reply(201, BATCH_RESPONSE)

      const bee = new Bee(MOCK_SERVER_URL)
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: true })).resolves.toEqual(BATCH_ID)
      assertAllIsDone()
    })

    it('should throw error if passed wrong gas price input', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.createPostageBatch('10', 17, { gasPrice: '-1' })).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if passed wrong immutable input', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'asd' })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: -1 })).rejects.toThrow(TypeError)

      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch('10', 17, { immutableFlag: 'true' })).rejects.toThrow(TypeError)
    })

    it('should throw error if too small depth', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', -1)).rejects.toThrow(BeeArgumentError)
      await expect(bee.createPostageBatch('10', 15)).rejects.toThrow(BeeArgumentError)
    })

    it('should throw error if too big depth', async () => {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.createPostageBatch('10', 256)).rejects.toThrow(BeeArgumentError)
    })
  })

  describe('getPostageBatch', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPostageBatch(input as BatchId)
    })
  })

  describe('hooks', () => {
    it('should call with request', async () => {
      const requestSpy = jest.fn()
      const responseSpy = jest.fn()

      const bee = new Bee(MOCK_SERVER_URL, { onRequest: requestSpy, onResponse: responseSpy })

      const topic = bee.makeFeedTopic('some-topic')
      fetchFeedUpdateMock(testIdentity.address, topic).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const feedReader = bee.makeFeedReader('sequence', topic, testIdentity.address)
      const feedUpdate = await feedReader.download()

      expect(feedUpdate.reference).toEqual(testJsonHash)

      expect(requestSpy.mock.calls.length).toEqual(1)
      expect(requestSpy.mock.calls[0].length).toEqual(1)
      expect(requestSpy.mock.calls[0][0]).toMatchObject({
        url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}?type=sequence`,
        method: 'GET',
        headers: { accept: 'application/json, text/plain, */*' },
      })

      expect(responseSpy.mock.calls.length).toEqual(1)
      expect(responseSpy.mock.calls[0].length).toEqual(1)
      expect(responseSpy.mock.calls[0][0]).toMatchObject({
        status: 200,
        statusText: '',
        headers: {
          'content-type': 'application/json',
        },
        request: {
          url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}?type=sequence`,
          method: 'GET',
          headers: { accept: 'application/json, text/plain, */*' },
        },
      })
      assertAllIsDone()
    })

    it('should call with request with correct headers', async () => {
      const requestSpy = jest.fn()
      const responseSpy = jest.fn()
      const bee = new Bee(MOCK_SERVER_URL, { onRequest: requestSpy, onResponse: responseSpy })

      uploadFileMock(testBatchId, 'nice.txt', { encrypt: true }).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt', { encrypt: true })

      expect(reference).toEqual({
        reference: testJsonHash,
        tagUid: 123,
      })

      expect(requestSpy.mock.calls.length).toEqual(1)
      expect(requestSpy.mock.calls[0].length).toEqual(1)
      expect(requestSpy.mock.calls[0][0]).toMatchObject({
        url: `${MOCK_SERVER_URL}bzz?name=nice.txt`,
        method: 'POST',
        headers: {
          accept: 'application/json, text/plain, */*',
          'swarm-encrypt': 'true',
          'swarm-postage-batch-id': testBatchId,
        },
      })

      expect(responseSpy.mock.calls.length).toEqual(1)
      expect(responseSpy.mock.calls[0].length).toEqual(1)
      expect(responseSpy.mock.calls[0][0]).toMatchObject({
        status: 200,
        statusText: '',
        headers: {
          'content-type': 'application/json',
        },
        request: {
          url: `${MOCK_SERVER_URL}bzz?name=nice.txt`,
          method: 'POST',
          headers: {
            accept: 'application/json, text/plain, */*',
            'swarm-encrypt': 'true',
            'swarm-postage-batch-id': testBatchId,
          },
        },
      })

      assertAllIsDone()
    })
  })
})
