import { assertAllIsDone, createPostageBatchMock, downloadDataMock, fetchFeedUpdateMock, MOCK_SERVER_URL } from './nock'
import { Bee, BeeArgumentError, BeeError, ReferenceResponse } from '../../src'
import { testIdentity, testJsonHash, testJsonPayload, testJsonStringPayload } from '../utils'
import { makeTopicFromString } from '../../src/feed/topic'

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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: 'asd' })).rejects.toThrow(TypeError)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Input testing
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: true })).rejects.toThrow(TypeError)
      await expect(bee.createPostageBatch(BigInt('10'), 17, { gasPrice: -1 })).rejects.toThrow(BeeArgumentError)
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
})
