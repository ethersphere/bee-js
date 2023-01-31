import { assertAllIsDone, downloadDataMock, fetchFeedUpdateMock, MOCK_SERVER_URL, uploadFileMock } from './nock'
import {
  BatchId,
  Bee,
  BeeArgumentError,
  CollectionUploadOptions,
  PssMessageHandler,
  ReferenceResponse,
  UploadOptions,
  RequestOptions,
  CHUNK_SIZE,
  SPAN_SIZE,
} from '../../src'
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
  testReferenceOrEnsAssertions,
} from './assertions'
import { FeedType } from '../../src/feed/type'
import { isStrictlyObject } from '../../src/utils/type'
import { fail } from 'assert'
import { expect } from 'chai'
import sinon from 'sinon'

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
          expect(e.value).to.eql(url)

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

    const bee = new Bee(MOCK_SERVER_URL, { defaultHeaders })
    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt')

    expect(reference).to.include({
      reference: testJsonHash,
      tagUid: 123,
    })

    expect(reference.cid()).to.eql(testJsonCid)
  })

  it('cid should throw for encrypted references', async function () {
    uploadFileMock(testBatchId, 'nice.txt').reply(200, {
      reference: testChunkEncryptedReference,
    } as ReferenceResponse)

    const bee = new Bee(MOCK_SERVER_URL)
    const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt')

    expect(reference).to.include({
      reference: testChunkEncryptedReference,
      tagUid: 123,
    })

    expect(() => reference.cid()).to.throw(TypeError)
  })

  describe('uploadData', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadData(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

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
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadData(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadData(testChunkHash, input as RequestOptions)
    })

    it('should accept valid ENS domain', async function () {
      downloadDataMock(testJsonEns).reply(200, testJsonStringPayload)

      const bee = new Bee(MOCK_SERVER_URL)
      expect((await bee.downloadData(testJsonEns)).text()).to.eql(testJsonStringPayload)
    })

    it('should accept valid ENS subdomain', async function () {
      downloadDataMock(`subdomain.${testJsonEns}`).reply(200, testJsonStringPayload)

      const bee = new Bee(MOCK_SERVER_URL)
      expect((await bee.downloadData(`subdomain.${testJsonEns}`)).text()).to.eql(testJsonStringPayload)
    })
  })

  describe('chunk', () => {
    it('should fail for small data', async function () {
      const content = new Uint8Array([1, 2, 3, 4, 5, 6, 7])

      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadChunk(testBatchId, content)).rejectedWith(BeeArgumentError)
    })

    it('should fail for big data', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadChunk(testBatchId, randomByteArray(CHUNK_SIZE + SPAN_SIZE + 1))).rejectedWith(
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

      return bee.downloadReadableData(testChunkHash, input as RequestOptions)
    })
  })

  describe('uploadFile', () => {
    testBatchIdAssertion(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.uploadFile(input as BatchId, '')
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

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
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadFile(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadFile(testChunkHash, '', input as RequestOptions)
    })
  })

  describe('downloadReadableFile', () => {
    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.downloadReadableFile(input as string)
    })

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.downloadReadableFile(testChunkHash, '', input as RequestOptions)
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

    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.uploadFilesFromDirectory(testBatchId, './test/data', input as RequestOptions)
    })

    it('should throw exception for bad Dir', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.uploadFilesFromDirectory(testBatchId, '')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, 1)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, [])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, {})).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, null)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.uploadFilesFromDirectory(testBatchId, undefined)).rejectedWith(TypeError)
    })
  })

  describe('retrieveTag', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.retrieveTag(0, input as RequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.retrieveTag('')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag([])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({})).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(null)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag(undefined)).rejectedWith(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: true })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: 'asdf' })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.retrieveTag({ total: null })).rejectedWith(TypeError)

      await expect(bee.retrieveTag(-1)).rejectedWith(BeeArgumentError)
    })
  })

  describe('deleteTag', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.deleteTag(0, input as RequestOptions)
    })

    it('should throw exception for bad Tag', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.deleteTag('')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag([])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({})).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(null)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag(undefined)).rejectedWith(TypeError)

      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: true })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: 'asdf' })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.deleteTag({ total: null })).rejectedWith(TypeError)

      await expect(bee.deleteTag(-1)).rejectedWith(BeeArgumentError)
    })
  })

  describe('getAllTags', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getAllTags(input as RequestOptions)
    })

    it('should throw exception for bad options', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags('')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(-1)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags([])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags(null)).rejectedWith(TypeError)
    })

    it('should throw exception for bad limit', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: '' })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: true })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: [] })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: {} })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ limit: null })).rejectedWith(TypeError)

      await expect(bee.getAllTags({ limit: -1 })).rejectedWith(BeeArgumentError)
      await expect(bee.getAllTags({ limit: Number.MAX_VALUE })).rejectedWith(BeeArgumentError)
    })

    it('should throw exception for bad offset', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: '' })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: true })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: [] })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: {} })).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.getAllTags({ offset: null })).rejectedWith(TypeError)

      await expect(bee.getAllTags({ offset: -1 })).rejectedWith(BeeArgumentError)
    })
  })

  describe('pin', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.pin(testChunkHash, input as RequestOptions)
    })

    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.pin(input as string)
    })
  })

  describe('unpin', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.unpin(testChunkHash, input as RequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.unpin(input as string)
    })
  })

  describe('getPin', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.getPin(testChunkHash, input as RequestOptions)
    })
    testReferenceAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.getPin(input as string)
    })
  })

  describe('reuploadPinnedData', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.reuploadPinnedData(testChunkHash, input as RequestOptions)
    })

    testReferenceOrEnsAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.reuploadPinnedData(input as string)
    })
  })

  describe('pssSend', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.pssSend(testBatchId, 'topic', '123', 'data', '', input as RequestOptions)
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
      await expect(bee.pssReceive('topic', true)).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', 'asd')).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', [])).rejectedWith(TypeError)
      // @ts-ignore: Type testing
      await expect(bee.pssReceive('topic', {})).rejectedWith(TypeError)
    })
  })

  describe('createFeedManifest', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.createFeedManifest(testBatchId, 'epoch', testChunkHash, testIdentity.address, input as RequestOptions)
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

      return bee.makeFeedReader('epoch', testChunkHash, testIdentity.address, input as RequestOptions)
    }, false)

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

      return bee.makeFeedWriter('epoch', testChunkHash, testIdentity.address, input as RequestOptions)
    }, false)

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
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      let opts

      if (isStrictlyObject(input)) {
        opts = {
          signer: testIdentity.privateKey,
          ...input,
        }
      } else {
        opts = input
      }

      return bee.setJsonFeed(testBatchId, 'epoch', '123', opts as RequestOptions)
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

      let opts

      if (isStrictlyObject(input)) {
        opts = {
          signer: testIdentity.privateKey,
          ...input,
        }
      } else {
        opts = input
      }

      return bee.getJsonFeed(TOPIC, opts as RequestOptions)
    })

    it('should fetch with specified address', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).to.eql(testJsonPayload)

      assertAllIsDone()
    })

    it('should fetch with specified signer private key', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL)
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).to.eql(testJsonPayload)

      assertAllIsDone()
    })

    it('should fetch with default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, { signer: testIdentity.privateKey })
      const json = await bee.getJsonFeed(TOPIC)
      expect(json).to.eql(testJsonPayload)

      assertAllIsDone()
    })

    it('should prioritize address option over default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
      expect(json).to.eql(testJsonPayload)

      assertAllIsDone()
    })

    it('should prioritize signer option over default instance signer', async function () {
      downloadDataMock(testJsonHash).reply(200, testJsonStringPayload)
      fetchFeedUpdateMock(testIdentity.address, HASHED_TOPIC).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const bee = new Bee(MOCK_SERVER_URL, {
        // Some other PK
        signer: '634fb5a811196d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const json = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
      expect(json).to.eql(testJsonPayload)

      assertAllIsDone()
    })

    it('should fail when both signer and address options are specified', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(
        bee.getJsonFeed(TOPIC, { address: testIdentity.address, signer: testIdentity.privateKey }),
      ).rejectedWith()
    })

    it('should fail if no signer or address is specified', async function () {
      const bee = new Bee(MOCK_SERVER_URL)

      await expect(bee.getJsonFeed(TOPIC)).rejectedWith()
    })
  })

  describe('makeSOCReader', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeSOCReader(testIdentity.privateKey, input as RequestOptions)
    }, false)

    testEthAddressAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCReader(input as string)
    })

    it('should set owner property', () => {
      const bee = new Bee(MOCK_SERVER_URL)

      const socReader = bee.makeSOCReader(testIdentity.address)
      expect(socReader.owner).to.eql(testIdentity.address)
    })
  })

  describe('makeSOCWriter', () => {
    testRequestOptionsAssertions(async (input: unknown, beeOptions) => {
      const bee = new Bee(MOCK_SERVER_URL, beeOptions)

      return bee.makeSOCWriter(testIdentity.privateKey, input as RequestOptions)
    }, false)

    testMakeSignerAssertions(async (input: unknown) => {
      const bee = new Bee(MOCK_SERVER_URL)

      return bee.makeSOCWriter(input as string)
    }, false)

    it('should set owner property', () => {
      const bee = new Bee(MOCK_SERVER_URL)

      const socReader = bee.makeSOCWriter(testIdentity.privateKey)
      expect(socReader.owner).to.eql(testIdentity.address)
    })
  })

  describe('hooks', () => {
    it('should call with request', async function () {
      const requestSpy = sinon.stub()
      const responseSpy = sinon.stub()

      const bee = new Bee(MOCK_SERVER_URL, { onRequest: requestSpy, onResponse: responseSpy })

      const topic = bee.makeFeedTopic('some-topic')
      fetchFeedUpdateMock(testIdentity.address, topic).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const feedReader = bee.makeFeedReader('sequence', topic, testIdentity.address)
      const feedUpdate = await feedReader.download()

      expect(feedUpdate.reference).to.eql(testJsonHash)

      expect(requestSpy).to.be.calledWithMatch({
        url: `${MOCK_SERVER_URL}feeds/${testIdentity.address}/${topic}?type=sequence`,
        method: 'GET',
        headers: { accept: 'application/json, text/plain, */*' },
      })

      expect(responseSpy).to.be.calledWithMatch({
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

    it('should call with request with correct headers', async function () {
      const requestSpy = sinon.stub()
      const responseSpy = sinon.stub()
      const bee = new Bee(MOCK_SERVER_URL, { onRequest: requestSpy, onResponse: responseSpy })

      uploadFileMock(testBatchId, 'nice.txt', { encrypt: true }).reply(200, {
        reference: testJsonHash,
      } as ReferenceResponse)

      const reference = await bee.uploadFile(testBatchId, 'hello world', 'nice.txt', { encrypt: true })

      expect(reference).to.include({
        reference: testJsonHash,
        tagUid: 123,
      })

      expect(reference.cid()).to.eql(testJsonCid)

      expect(requestSpy).to.be.calledWithMatch({
        url: `${MOCK_SERVER_URL}bzz?name=nice.txt`,
        method: 'POST',
        headers: {
          accept: 'application/json, text/plain, */*',
          'swarm-encrypt': 'true',
          'swarm-postage-batch-id': testBatchId,
        },
      })

      expect(responseSpy).to.be.calledWithMatch({
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
