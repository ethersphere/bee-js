import { Bee, BeeDebug, Collection, PssSubscription } from '../../src'
import { makeSigner } from '../../src/chunk/signer'
import { makeSOCAddress, uploadSingleOwnerChunkData } from '../../src/chunk/soc'
import { ChunkReference } from '../../src/feed'
import * as bzz from '../../src/modules/bzz'
import { REFERENCE_HEX_LENGTH } from '../../src/types'
import { makeBytes } from '../../src/utils/bytes'
import { makeEthAddress } from '../../src/utils/eth'
import { bytesToHex, HexString } from '../../src/utils/hex'
import {
  beeDebugUrl,
  beeKy,
  beePeerDebugUrl,
  beePeerUrl,
  beeUrl,
  commonMatchers,
  createRandomNodeReadable,
  createReadableStream,
  ERR_TIMEOUT,
  FEED_TIMEOUT,
  getPostageBatch,
  makeTestTarget,
  PSS_TIMEOUT,
  randomByteArray,
  sleep,
  testChunkPayload,
  testIdentity,
  testJsonHash,
  testJsonPayload,
  tryDeleteChunkFromLocalStorage,
} from '../utils'
import { Readable } from 'stream'
import { TextEncoder } from 'util'

commonMatchers()

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const BEE_KY = beeKy()
  const BEE_PEER_URL = beePeerUrl()
  const BEE_DEBUG_PEER_URL = beePeerDebugUrl()
  const bee = new Bee(BEE_URL)
  const beePeer = new Bee(BEE_PEER_URL)

  it('should strip trailing slash', () => {
    const bee = new Bee('http://localhost:1633/')
    expect(bee.url).toEqual('http://localhost:1633')
  })

  describe('chunk', () => {
    it('should upload and download chunk', async () => {
      const content = randomByteArray(100)

      const reference = await bee.uploadChunk(getPostageBatch(), content)
      const downloadedChunk = await bee.downloadChunk(reference)

      expect(downloadedChunk).toEqual(content)
    })
  })

  describe('files', () => {
    it('should work with files', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const contentType = 'text/html'

      const result = await bee.uploadFile(getPostageBatch(), content, name, { contentType })
      const file = await bee.downloadFile(result.reference)

      expect(file.name).toEqual(name)
      expect(file.data).toEqual(content)
    })

    it('should work with files and tags', async () => {
      const tag = await bee.createTag()

      // Should fit into 4 chunks
      const content = randomByteArray(13000)
      const name = 'hello.txt'
      const contentType = 'text/html'

      const result = await bee.uploadFile(getPostageBatch(), content, name, { contentType, tag: tag.uid })
      const file = await bee.downloadFile(result.reference)

      expect(file.name).toEqual(name)
      expect(file.data).toEqual(content)

      const retrievedTag = await bee.retrieveTag(tag)
      expect(retrievedTag.total).toEqual(8)
    })

    it('should work with file object', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const type = 'text/plain'
      const file = {
        arrayBuffer: () => content,
        name,
        type,
      } as unknown as File

      const result = await bee.uploadFile(getPostageBatch(), file)
      const downloadedFile = await bee.downloadFile(result.reference)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.name).toEqual(name)
      expect(downloadedFile.contentType).toEqual(type)
    })

    it('should work with file object and name overridden', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const file = {
        arrayBuffer: () => content,
        name,
      } as unknown as File
      const nameOverride = 'hello-override.txt'

      const result = await bee.uploadFile(getPostageBatch(), file, nameOverride)
      const downloadedFile = await bee.downloadFile(result.reference)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.name).toEqual(nameOverride)
    })

    it('should work with file object and content-type overridden', async () => {
      const content = new Uint8Array([1, 2, 3])
      const file = {
        arrayBuffer: () => content,
        name: 'hello.txt',
        type: 'text/plain',
      } as unknown as File
      const contentTypeOverride = 'text/plain+override'

      const result = await bee.uploadFile(getPostageBatch(), file, undefined, { contentType: contentTypeOverride })
      const downloadedFile = await bee.downloadFile(result.reference)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.contentType).toEqual(contentTypeOverride)
    })

    it('should work with NodeJS readable', async () => {
      const readable = Readable.from([new TextEncoder().encode('hello '), new TextEncoder().encode('world')])
      const name = 'hello.txt'
      const contentType = 'text/plain'

      const result = await bee.uploadFile(getPostageBatch(), readable, name, { contentType })
      const file = await bee.downloadFile(result.reference)

      expect(file.name).toEqual(name)
      expect(file.data.text()).toEqual('hello world')
    })

    it('should work with WHATWG readable-stream', async () => {
      const readable = createReadableStream([new TextEncoder().encode('hello '), new TextEncoder().encode('world')])
      const name = 'hello.txt'
      const contentType = 'text/plain'

      const result = await bee.uploadFile(getPostageBatch(), readable, name, { contentType })
      const file = await bee.downloadFile(result.reference)

      expect(file.name).toEqual(name)
      expect(file.data.text()).toEqual('hello world')
    }, 1000000)

    it('should work with readable and tags', async () => {
      const tag = await bee.createTag()

      const readable = createRandomNodeReadable(13000)
      const name = 'hello.txt'
      const contentType = 'text/plain'

      const result = await bee.uploadFile(getPostageBatch(), readable, name, {
        contentType,
        tag: tag.uid,
      })

      const file = await bee.downloadFile(result.reference)

      expect(file.name).toEqual(name)
      expect(file.data.length).toEqual(13000)

      const retrievedTag = await bee.retrieveTag(tag)
      expect(retrievedTag.total).toEqual(8)
    })
  })

  describe('collections', () => {
    it('should work with directory with unicode filenames', async () => {
      const result = await bee.uploadFilesFromDirectory(getPostageBatch(), './test/data')

      expect(result.reference.length).toEqual(REFERENCE_HEX_LENGTH)
    })

    it('should upload collection', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: new TextEncoder().encode('hello-world'),
        },
      ]

      const result = await bee.uploadCollection(getPostageBatch(), directoryStructure)
      const file = await bee.downloadFile(result.reference, directoryStructure[0].path)

      expect(file.name).toEqual(directoryStructure[0].path)
      expect(file.data.text()).toEqual('hello-world')
    })
  })

  describe('tags', () => {
    it('should list tags', async () => {
      const originalTags = await bee.getAllTags({ limit: 1000 })
      const createdTag = await bee.createTag()
      const updatedTags = await bee.getAllTags({ limit: 1000 })

      expect(updatedTags.length - originalTags.length).toEqual(1)
      expect(originalTags.find(tag => tag.uid === createdTag.uid)).toBeFalsy()
      expect(updatedTags.find(tag => tag.uid === createdTag.uid)).toBeTruthy()
    })

    it('should retrieve previously created empty tag', async () => {
      const tag = await bee.createTag()
      const tag2 = await bee.retrieveTag(tag)

      expect(tag).toEqual(tag2)
    })

    it('should delete tag', async () => {
      const createdTag = await bee.createTag()
      const originalTags = await bee.getAllTags({ limit: 1000 })
      expect(originalTags.find(tag => tag.uid === createdTag.uid)).toBeTruthy()

      await bee.deleteTag(createdTag)
      const updatedTags = await bee.getAllTags({ limit: 1000 })

      expect(updatedTags.length - originalTags.length).toEqual(-1)
      expect(updatedTags.find(tag => tag.uid === createdTag.uid)).toBeFalsy()
    })
  })

  describe('pinning', () => {
    it('should list all pins', async () => {
      const content = new Uint8Array([1, 2, 3])
      const result = await bee.uploadFile(getPostageBatch(), content)

      await bee.pin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong

      const pinnedChunks = await bee.getAllPins()
      expect(pinnedChunks).toBeType('array')
      expect(pinnedChunks.includes(result.reference)).toBeTruthy()
    })

    it('should get pinning status', async () => {
      const content = randomByteArray(16, Date.now())
      const result = await bee.uploadFile(getPostageBatch(), content, 'test', {
        pin: false,
      })

      const statusBeforePinning = bee.getPin(result.reference)
      await expect(statusBeforePinning).rejects.toThrowError('Not Found')

      await bee.pin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong

      const statusAfterPinning = await bee.getPin(result.reference)
      expect(statusAfterPinning).toHaveProperty('reference', result.reference)
    })

    it('should pin and unpin files', async () => {
      const content = new Uint8Array([1, 2, 3])

      const result = await bee.uploadFile(getPostageBatch(), content)

      await bee.pin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
      await bee.unpin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should pin and unpin collection from directory', async () => {
      const path = './test/data/'
      const result = await bee.uploadFilesFromDirectory(getPostageBatch(), path)

      await bee.pin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
      await bee.unpin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })

    it('should pin and unpin data', async () => {
      const content = new Uint8Array([1, 2, 3])

      const result = await bee.uploadData(getPostageBatch(), content)

      await bee.pin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
      await bee.unpin(result.reference) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    })
  })

  describe('stewardship', () => {
    it('should reupload pinned data', async () => {
      const content = randomByteArray(16, Date.now())
      const result = await bee.uploadData(getPostageBatch(), content, { pin: true })

      await sleep(10)
      await bee.reuploadPinnedData(result.reference) // Does not return anything, but will throw exception if something is going wrong
    })

    it(
      'should check if reference is retrievable',
      async () => {
        const content = randomByteArray(16, Date.now())
        const result = await bee.uploadData(getPostageBatch(), content, { pin: true })

        await sleep(10)
        await expect(bee.isReferenceRetrievable(result.reference)).resolves.toEqual(true)

        // Reference that has correct form, but should not exist on the network
        await expect(
          bee.isReferenceRetrievable('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4332'),
        ).resolves.toEqual(false)
      },
      ERR_TIMEOUT,
    )
  })

  describe('pss', () => {
    it(
      'should send and receive data',
      async () => {
        return new Promise<void>((resolve, reject) => {
          ;(async () => {
            const topic = 'bee-class-topic'
            const message = new Uint8Array([1, 2, 3])
            const beeDebug = new BeeDebug(beeDebugUrl())

            bee.pssReceive(topic).then(receivedMessage => {
              expect(receivedMessage).toEqual(message)
              resolve()
            })

            const { overlay } = await beeDebug.getNodeAddresses()
            await beePeer.pssSend(getPostageBatch(BEE_DEBUG_PEER_URL), topic, makeTestTarget(overlay), message)
          })().catch(reject)
        })
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive data with public key',
      async () => {
        return new Promise<void>((resolve, reject) => {
          // Jest does not allow use `done` and return Promise so this wrapper work arounds that.
          ;(async () => {
            const topic = 'bee-class-topic-publickey'
            const message = new Uint8Array([1, 2, 3])
            const beeDebug = new BeeDebug(beeDebugUrl())

            bee.pssReceive(topic).then(receivedMessage => {
              expect(receivedMessage).toEqual(message)
              resolve()
            })

            const { overlay, pssPublicKey } = await beeDebug.getNodeAddresses()
            await beePeer.pssSend(
              getPostageBatch(BEE_DEBUG_PEER_URL),
              topic,
              makeTestTarget(overlay),
              message,
              pssPublicKey,
            )
          })().catch(reject)
        })
      },
      PSS_TIMEOUT,
    )

    it(
      'should subscribe to topic',
      async () => {
        return new Promise<void>((resolve, reject) => {
          let subscription: PssSubscription
          ;(async () => {
            const topic = 'bee-class-subscribe-topic'
            const message = new Uint8Array([1, 2, 3])
            const beeDebug = new BeeDebug(beeDebugUrl())

            subscription = bee.pssSubscribe(topic, {
              onMessage: receivedMessage => {
                // without cancel jest complains for leaking handles and may hang
                subscription?.cancel()

                expect(receivedMessage).toEqual(message)
                resolve()
              },
              onError: e => {
                throw e
              },
            })

            const { overlay } = await beeDebug.getNodeAddresses()
            await beePeer.pssSend(getPostageBatch(BEE_DEBUG_PEER_URL), topic, makeTestTarget(overlay), message)
          })().catch(e => {
            // without cancel jest complains for leaking handles and may hang
            subscription?.cancel()
            reject(e)
          })
        })
      },
      PSS_TIMEOUT,
    )

    it('should time out', async () => {
      const topic = 'bee-class-receive-timeout'

      await expect(bee.pssReceive(topic, 1)).rejects.toThrow('pssReceive timeout')
    })
  })

  describe('feeds', () => {
    const owner = testIdentity.address
    const signer = testIdentity.privateKey
    const topic = randomByteArray(32, Date.now())

    it(
      'feed writer with two updates',
      async () => {
        const feed = bee.makeFeedWriter('sequence', topic, signer)
        const referenceZero = makeBytes(32) // all zeroes

        await feed.upload(getPostageBatch(), referenceZero)
        const firstUpdateReferenceResponse = await feed.download()

        expect(firstUpdateReferenceResponse.reference).toEqual(bytesToHex(referenceZero))
        expect(firstUpdateReferenceResponse.feedIndex).toEqual('0000000000000000')

        const referenceOne = new Uint8Array([...new Uint8Array([1]), ...new Uint8Array(31)]) as ChunkReference

        await feed.upload(getPostageBatch(), referenceOne)
        const secondUpdateReferenceResponse = await feed.download()

        expect(secondUpdateReferenceResponse.reference).toEqual(bytesToHex(referenceOne))
        expect(secondUpdateReferenceResponse.feedIndex).toEqual('0000000000000001')
        // TODO the timeout was increased because this test is flaky
        //  most likely there is an issue with the lookup
        //  https://github.com/ethersphere/bee/issues/1248#issuecomment-786588911
      },
      FEED_TIMEOUT,
    )

    it(
      'create feeds manifest and retrieve the data',
      async () => {
        const directoryStructure: Collection<Uint8Array> = [
          {
            path: 'index.html',
            data: new TextEncoder().encode('some data'),
          },
        ]
        const cacResult = await bzz.uploadCollection(BEE_KY, directoryStructure, getPostageBatch())

        const feed = bee.makeFeedWriter('sequence', topic, signer)
        await feed.upload(getPostageBatch(), cacResult.reference)
        const manifestReference = await bee.createFeedManifest(getPostageBatch(), 'sequence', topic, owner)

        expect(typeof manifestReference).toBe('string')

        // this calls /bzz endpoint that should resolve the manifest and the feed returning the latest feed's content
        const file = await bee.downloadFile(manifestReference, 'index.html')
        expect(new TextDecoder().decode(file.data)).toEqual('some data')
      },
      FEED_TIMEOUT,
    )

    describe('topic', () => {
      it('create feed topic', () => {
        const topic = bee.makeFeedTopic('swarm.eth:application:handshake')
        const feed = bee.makeFeedReader('sequence', topic, owner)

        expect(feed.topic).toEqual(topic)
      })
    })
  })

  describe('soc', () => {
    const socHash = '9d453ebb73b2fedaaf44ceddcf7a0aa37f3e3d6453fea5841c31f0ea6d61dc85' as HexString

    describe('writer', () => {
      it('should read and write', async () => {
        const identifier = makeBytes(32) // all zeroes
        const socAddress = makeSOCAddress(identifier, makeEthAddress(testIdentity.address))
        await tryDeleteChunkFromLocalStorage(socAddress)

        const socWriter = bee.makeSOCWriter(testIdentity.privateKey)

        const reference = await socWriter.upload(getPostageBatch(), identifier, testChunkPayload)
        expect(reference).toEqual(socHash)

        const soc = await socWriter.download(identifier)
        const payload = soc.payload()
        expect(payload).toEqual(testChunkPayload)
      })
    })

    describe('reader', () => {
      it('should read', async () => {
        const signer = makeSigner(testIdentity.privateKey)
        const identifier = makeBytes(32) // all zeroes
        const socAddress = makeSOCAddress(identifier, makeEthAddress(testIdentity.address))
        await tryDeleteChunkFromLocalStorage(socAddress)
        await uploadSingleOwnerChunkData(BEE_KY, signer, getPostageBatch(), identifier, testChunkPayload)

        const socReader = bee.makeSOCReader(testIdentity.address)
        const soc = await socReader.download(identifier)
        const payload = soc.payload()
        expect(payload).toEqual(testChunkPayload)
      })
    })
  })

  describe('signer', () => {
    it('should be possible to pass it in constructor', async () => {
      const identifier = makeBytes(32)
      identifier[31] = 1

      const socAddress = makeSOCAddress(identifier, makeEthAddress(testIdentity.address))
      await tryDeleteChunkFromLocalStorage(socAddress)

      const bee = new Bee(BEE_URL, { signer: testIdentity.privateKey })
      const socWriter = bee.makeSOCWriter()

      const reference = await socWriter.upload(getPostageBatch(), identifier, testChunkPayload)
      expect(reference).toEqual('00019ec85e8859aa641cf149fbd1147ac7965a9cad1dfe4ab7beaa12d5dc8027')
    })

    it('should prioritize signer passed to method', async () => {
      const identifier = makeBytes(32)
      identifier[31] = 2

      const socAddress = makeSOCAddress(identifier, makeEthAddress(testIdentity.address))
      await tryDeleteChunkFromLocalStorage(socAddress)

      // We pass different private key to the instance
      const bee = new Bee(BEE_URL, {
        signer: '634fb5a872396d9611e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd',
      })
      const socWriter = bee.makeSOCWriter(testIdentity.privateKey)

      const reference = await socWriter.upload(getPostageBatch(), identifier, testChunkPayload)
      expect(reference).toEqual('d1a21cce4c86411f6af2f621ce9a3a0aa3cc5cea6cc9e1b28523d28411398cfb')
    })

    it('should throw if no signers are passed', () => {
      const bee = new Bee(BEE_URL)
      expect(() => bee.makeSOCWriter()).toThrow()
    })
  })

  describe('JsonFeed', () => {
    const TOPIC = 'some=very%nice#topic'

    it(
      'should set JSON to feed',
      async () => {
        await bee.setJsonFeed(getPostageBatch(), TOPIC, testJsonPayload, { signer: testIdentity.privateKey })

        const hashedTopic = bee.makeFeedTopic(TOPIC)
        const reader = bee.makeFeedReader('sequence', hashedTopic, testIdentity.address)
        const chunkReferenceResponse = await reader.download()
        expect(chunkReferenceResponse.reference).toEqual(testJsonHash)

        const downloadedData = await bee.downloadData(chunkReferenceResponse.reference)
        expect(downloadedData.json()).toEqual(testJsonPayload)
      },
      FEED_TIMEOUT,
    )

    it(
      'should get JSON from feed',
      async () => {
        const data = [{ some: { other: 'object' } }]

        const hashedTopic = bee.makeFeedTopic(TOPIC)
        const writer = bee.makeFeedWriter('sequence', hashedTopic, testIdentity.privateKey)
        const dataChunkResult = await bee.uploadData(getPostageBatch(), JSON.stringify(data))
        await writer.upload(getPostageBatch(), dataChunkResult.reference)

        const fetchedData = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
        expect(fetchedData).toEqual(data)
      },
      FEED_TIMEOUT,
    )
    it(
      'should get JSON from feed with address',
      async () => {
        const data = [{ some: { other: 'object' } }]

        const hashedTopic = bee.makeFeedTopic(TOPIC)
        const writer = bee.makeFeedWriter('sequence', hashedTopic, testIdentity.privateKey)
        const dataChunkResult = await bee.uploadData(getPostageBatch(), JSON.stringify(data))
        await writer.upload(getPostageBatch(), dataChunkResult.reference)

        const fetchedData = await bee.getJsonFeed(TOPIC, { address: testIdentity.address })
        expect(fetchedData).toEqual(data)
      },
      FEED_TIMEOUT,
    )
  })
})
