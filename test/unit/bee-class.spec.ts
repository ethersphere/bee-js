import {
  BatchId,
  Bee,
  BeeArgumentError,
  BeeRequestOptions,
  CHUNK_SIZE,
  CollectionUploadOptions,
  PssMessageHandler,
  ReferenceResponse,
  SPAN_SIZE,
  UploadOptions,
} from '../../src'
import { makeTopicFromString } from '../../src/feed/topic'
import { FeedType } from '../../src/feed/type'
import {
  randomByteArray,
  testBatchId,
  testChunkEncryptedReference,
  testChunkHash,
  testIdentity,
  testJsonCid,
  testJsonEns,
  testJsonHash,
  testJsonPayload,
  testJsonStringPayload,
} from '../utils'
import {
  testAddressPrefixAssertions,
  testBatchIdAssertion,
  testCollectionUploadOptionsAssertions,
  testDataAssertions,
  testEthAddressAssertions,
  testFeedTopicAssertions,
  testFeedTypeAssertions,
  testFileDataAssertions,
  testFileUploadOptionsAssertions,
  testMakeSignerAssertions,
  testPssMessageHandlerAssertions,
  testPublicKeyAssertions,
  testReferenceAssertions,
  testReferenceOrEnsAssertions,
  testRequestOptionsAssertions,
  testTopicAssertions,
  testUploadOptionsAssertions,
} from './assertions'
import { assertAllIsDone, downloadDataMock, fetchFeedUpdateMock, MOCK_SERVER_URL, uploadFileMock } from './nock'

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
          expect(e.value).toBe(url)

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

  it('should set default headers and use them if specified', async function () {
    const defaultHeaders = { 'X-Awesome-Header': '123' }
    uploadFileMock(testBatchId, 'nice.txt', {}, defaultHeaders).reply(200, {
      reference: testJsonHash,
    } as ReferenceResponse)

    const bee = new Bee(MOCK_SERVER_URL, { headers: defaultHeaders })
    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt')

    expect(reference).toMatchObject({
      reference: testJsonHash,
      tagUid: 123,
    })

    expect(reference.cid()).toBe(testJsonCid)
  })

  it('cid should throw for encrypted references', async function () {
    uploadFileMock(testBatchId, 'nice.txt').reply(200, {
      reference: testChunkEncryptedReference,
    } as ReferenceResponse)

    const bee = new Bee(MOCK_SERVER_URL)
    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt')

    expect(reference).toMatchObject({
      reference: testChunkEncryptedReference,
      tagUid: 123,
    })

    expect(() => reference.cid()).toThrow(TypeError)
  })

  describe('uploadData', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.uploadData(testBatchId, '', undefined, input as BeeRequestOptions)
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
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadData(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadData(testChunkHash, input as BeeRequestOptions)
    })

    it('should accept valid ENS domain', async function () {
      downloadDataMock(testJsonEns).reply(200, testJsonStringPayload)

      const bee = new Bee(MOCK_SERVER_URL)
      expect((await bee.downloadData(testJsonEns)).text()).toBe(testJsonStringPayload)
    })

    it('should accept valid ENS subdomain', async function () {
      downloadDataMock(`subdomain.${testJsonEns}`).reply(200, testJsonStringPayload)

      const bee = new Bee(MOCK_SERVER_URL)
      expect((await bee.downloadData(`subdomain.${testJsonEns}`)).text()).toBe(testJsonStringPayload)
    })
  })

  describe('chunk', () => {
    it('should fail for small data', async function () {
      const content = new Uint8Array([1, 2, 3, 4, 5, 6, 7])

      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadChunk(testBatchId, content)).rejects.toThrow(BeeArgumentError)
    })

    it('should fail for big data', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadChunk(testBatchId, randomByteArray(CHUNK_SIZE + SPAN_SIZE + 1))).rejects.toThrow(
        BeeArgumentError,
      )
    })
  })

  describe('downloadReadableData', () => {
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableData(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadReadableData(testChunkHash, input as BeeRequestOptions)
    })
  })

  describe('uploadFile', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.uploadFile(testBatchId, '', undefined, undefined, input as BeeRequestOptions)
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
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadFile(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadFile(testChunkHash, '', input as BeeRequestOptions)
    })
  })

  describe('downloadReadableFile', () => {
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableFile(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadReadableFile(testChunkHash, '', input as BeeRequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.uploadFiles(testBatchId, files, undefined, input as BeeRequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.uploadFilesFromDirectory(testBatchId, './test/data', undefined, input as BeeRequestOptions)
    })

    it('should throw exception for bad Dir', async function () {
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.retrieveTag(0, input as BeeRequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.deleteTag(0, input as BeeRequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getAllTags({}, input as BeeRequestOptions)
    })

    it('should throw exception for bad options', async function () {
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

    it('should throw exception for bad limit', async function () {
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

    it('should throw exception for bad offset', async function () {
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.pin(testChunkHash, input as BeeRequestOptions)
    })

    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pin(input as string)
    })
  })

  describe('unpin', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.unpin(testChunkHash, input as BeeRequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.unpin(input as string)
    })
  })

  describe('getPin', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPin(testChunkHash, input as BeeRequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPin(input as string)
    })
  })

  describe('reuploadPinnedData', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.reuploadPinnedData(testChunkHash, input as BeeRequestOptions)
    })

    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.reuploadPinnedData(input as string)
    })
  })

  describe('pssSend', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.pssSend(testBatchId, 'topic', '123', 'data', '', input as BeeRequestOptions)
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

    it('should throw exception for bad Timeout', async function () {
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.createFeedManifest(
        testBatchId,
        'epoch',
        testChunkHash,
        testIdentity.address,
        input as BeeRequestOptions,
      )
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeFeedReader('epoch', testChunkHash, testIdentity.address, input as BeeRequestOptions)
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeFeedWriter('epoch', testChunkHash, testIdentity.address, input as BeeRequestOptions)
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

  // TODO: Finish testing
  describe('setJsonFeed', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      const opts = {
        signer: testIdentity.privateKey,
      }

      return bee.setJsonFeed(testBatchId, 'epoch', '123', opts, input as BeeRequestOptions)
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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      const opts = {
        signer: testIdentity.privateKey,
      }

      return bee.getJsonFeed(TOPIC, opts, input as BeeRequestOptions)
    })

    it.skip('should fetch with specified address', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).toBe(testJsonPayload)

      assertAllIsDone()
    })

    it.skip('should fetch with specified signer private key', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).toBe(testJsonPayload)

      assertAllIsDone()
    })

    it.skip('should fetch with default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, { signer: testIdentity.privateKey })
      const json = await bee.getJsonFeed(TOPIC)
      expect(json).toBe(testJsonPayload)

      assertAllIsDone()
    })

    it.skip('should prioritize address option over default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).toBe(testJsonPayload)

      assertAllIsDone()
    })

    it.skip('should prioritize signer option over default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).toBe(testJsonPayload)

      assertAllIsDone()
    })

    it('should fail when both signer and address options are specified', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(
        bee.getJsonFeed(TOPIC, { address: testIdentity.address, signer: testIdentity.privateKey }),
      ).rejects.toThrow()
    })

    it('should fail if no signer or address is specified', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.getJsonFeed(TOPIC)).rejects.toThrow()
    })
  })

  describe('makeSOCReader', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeSOCReader(testIdentity.privateKey, input as BeeRequestOptions)
    })

    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCReader(input as string)
    })

    it('should set owner property', () => {
      const bee = new Bee(MOCK_SERVER_URL)

      const socReader = bee.makeSOCReader(testIdentity.address)
      expect(socReader.owner).toBe(testIdentity.address)
    })
  })

  describe('makeSOCWriter', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeSOCWriter(testIdentity.privateKey, input as BeeRequestOptions)
    })

    testMakeSignerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCWriter(input as string)
    })

    it('should set owner property', () => {
      const bee = new Bee(MOCK_SERVER_URL)

      const socReader = bee.makeSOCWriter(testIdentity.privateKey)
      expect(socReader.owner).toBe(testIdentity.address)
    })
  })
})
