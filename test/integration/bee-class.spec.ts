import { Bee, BeeDebug, Collection } from '../../src'
import { BeeArgumentError } from '../../src/utils/error'

import { ChunkReference } from '../../src/feed'
import { REFERENCE_HEX_LENGTH } from '../../src/types'
import { makeBytes } from '../../src/utils/bytes'
import { bytesToHex, HexString } from '../../src/utils/hex'
import {
  beeDebugUrl,
  beePeerUrl,
  beeUrl,
  FEED_TIMEOUT,
  okResponse,
  PSS_TIMEOUT,
  randomByteArray,
  testChunkPayload,
  testIdentity,
  tryDeleteChunkFromLocalStorage,
} from '../utils'
import { makeSigner } from '../../src/chunk/signer'
import { makeSOCAddress, uploadSingleOwnerChunkData } from '../../src/chunk/soc'
import { makeEthAddress } from '../../src/utils/eth'
import * as collection from '../../src/modules/collection'

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

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

  it('should strip trailing slash', () => {
    const bee = new Bee('http://localhost:1633/')
    expect(bee.url).toEqual('http://localhost:1633')
  })

  describe('files', () => {
    it('should work with files', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const contentType = 'text/html'

      const hash = await bee.uploadFile(content, name, { contentType })
      const file = await bee.downloadFile(hash)

      expect(file.name).toEqual(name)
      expect(file.data).toEqual(content)
    })

    it('should work with file object', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const type = 'text/plain'
      const file = ({
        arrayBuffer: () => content,
        name,
        type,
      } as unknown) as File

      const hash = await bee.uploadFile(file)
      const downloadedFile = await bee.downloadFile(hash)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.name).toEqual(name)
      expect(downloadedFile.contentType).toEqual(type)
    })

    it('should work with file object and name overridden', async () => {
      const content = new Uint8Array([1, 2, 3])
      const name = 'hello.txt'
      const file = ({
        arrayBuffer: () => content,
        name,
      } as unknown) as File
      const nameOverride = 'hello-override.txt'

      const hash = await bee.uploadFile(file, nameOverride)
      const downloadedFile = await bee.downloadFile(hash)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.name).toEqual(nameOverride)
    })

    it('should work with file object and content-type overridden', async () => {
      const content = new Uint8Array([1, 2, 3])
      const file = ({
        arrayBuffer: () => content,
        name: 'hello.txt',
        type: 'text/plain',
      } as unknown) as File
      const contentTypeOverride = 'text/plain+override'

      const hash = await bee.uploadFile(file, undefined, { contentType: contentTypeOverride })
      const downloadedFile = await bee.downloadFile(hash)

      expect(downloadedFile.data).toEqual(content)
      expect(downloadedFile.contentType).toEqual(contentTypeOverride)
    })
  })

  describe('collections', () => {
    it('should work with directory with unicode filenames', async () => {
      const hash = await bee.uploadFilesFromDirectory('./test/data')

      expect(hash.length).toEqual(REFERENCE_HEX_LENGTH)
    })
  })

  describe('tags', () => {
    it('should retrieve previously created empty tag', async () => {
      const tag = await bee.createTag()
      const tag2 = await bee.retrieveTag(tag)

      expect(tag).toEqual(tag2)
    })
  })

  describe('pinning', () => {
    it('should list pinned chunks', async () => {
      const content = new Uint8Array([1, 2, 3])
      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const pinnedChunks = await bee.getPinnedChunks()
      expect(pinnedChunks).toHaveProperty('chunks')
      expect(pinnedChunks.chunks.length).toBeGreaterThanOrEqual(1)
      expect(pinnedChunks.chunks.find(chunk => chunk.address === hash)).toBeTruthy()
    })

    it('should get pinning status', async () => {
      const content = randomByteArray(16, Date.now())
      const hash = await bee.uploadFile(content, 'test', {
        pin: false,
      })

      const statusBeforePinning = bee.getChunkPinningStatus(hash)
      await expect(statusBeforePinning).rejects.toThrowError('Not Found')

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const statusAfterPinning = await bee.getChunkPinningStatus(hash)
      expect(statusAfterPinning).toHaveProperty('address', hash)
      expect(statusAfterPinning).toHaveProperty('pinCounter', 1)
    })

    it('should pin and unpin files', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinFile(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unpin chunks', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinChunk(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinChunk(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unpin collection', async () => {
      const path = './test/data/'
      const hash = await bee.uploadFilesFromDirectory(path)

      const pinResponse = await bee.pinCollection(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinCollection(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unpin data', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadData(content)

      const pinResponse = await bee.pinData(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinData(hash)
      expect(unpinResponse).toEqual(okResponse)
    })
  })

  describe('pss', () => {
    it(
      'should send and receive data',
      async done => {
        const topic = 'bee-class-topic'
        const message = new Uint8Array([1, 2, 3])
        const beeDebug = new BeeDebug(beeDebugUrl())

        bee.pssReceive(topic).then(receivedMessage => {
          expect(receivedMessage).toEqual(message)
          done()
        })

        const { overlay } = await beeDebug.getNodeAddresses()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, overlay, message)
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive data with public key',
      async done => {
        const topic = 'bee-class-topic-publickey'
        const message = new Uint8Array([1, 2, 3])
        const beeDebug = new BeeDebug(beeDebugUrl())

        bee.pssReceive(topic).then(receivedMessage => {
          expect(receivedMessage).toEqual(message)
          done()
        })

        const { overlay, pss_public_key } = await beeDebug.getNodeAddresses()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, overlay, message, pss_public_key)
      },
      PSS_TIMEOUT,
    )

    it(
      'should subscribe to topic',
      async done => {
        const topic = 'bee-class-subscribe-topic'
        const message = new Uint8Array([1, 2, 3])
        const beeDebug = new BeeDebug(beeDebugUrl())

        const subscription = bee.pssSubscribe(topic, {
          onMessage: receivedMessage => {
            // without cancel jest complains for leaking handles and may hang
            subscription.cancel()

            expect(receivedMessage).toEqual(message)
            done()
          },
          onError: e => {
            throw e
          },
        })

        const { overlay } = await beeDebug.getNodeAddresses()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, overlay, message)
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

        await feed.upload(referenceZero)
        const firstUpdateReferenceResponse = await feed.download()

        expect(firstUpdateReferenceResponse.reference).toEqual(bytesToHex(referenceZero))
        expect(firstUpdateReferenceResponse.feedIndex).toEqual('0000000000000000')

        const referenceOne = new Uint8Array([...new Uint8Array([1]), ...new Uint8Array(31)]) as ChunkReference

        await feed.upload(referenceOne)
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
        const cacHash = await collection.upload(BEE_URL, directoryStructure)

        const feed = bee.makeFeedWriter('sequence', topic, signer)
        await feed.upload(cacHash)
        const manifestReference = await bee.createFeedManifest('sequence', topic, owner)

        expect(typeof manifestReference).toBe('string')

        // this calls /bzz endpoint that should resolve the manifest and the feed returning the latest feed's content
        const bzz = await bee.downloadFileFromCollection(manifestReference, 'index.html')
        expect(new TextDecoder().decode(bzz.data)).toEqual('some data')
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

        const reference = await socWriter.upload(identifier, testChunkPayload)
        expect(reference).toEqual({ reference: socHash })

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
        await uploadSingleOwnerChunkData(BEE_URL, signer, identifier, testChunkPayload)

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

      const reference = await socWriter.upload(identifier, testChunkPayload)
      expect(reference).toEqual({ reference: '00019ec85e8859aa641cf149fbd1147ac7965a9cad1dfe4ab7beaa12d5dc8027' })
    })

    it('should prioritize signer passed to method', async () => {
      const identifier = makeBytes(32)
      identifier[31] = 2

      const socAddress = makeSOCAddress(identifier, makeEthAddress(testIdentity.address))
      await tryDeleteChunkFromLocalStorage(socAddress)

      // We pass different private key to the instance
      const bee = new Bee(BEE_URL, { signer: '634fb5a872396d9611e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' })
      const socWriter = bee.makeSOCWriter(testIdentity.privateKey)

      const reference = await socWriter.upload(identifier, testChunkPayload)
      expect(reference).toEqual({ reference: 'd1a21cce4c86411f6af2f621ce9a3a0aa3cc5cea6cc9e1b28523d28411398cfb' })
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
        const data = [{ some: 'object' }]
        await bee.setJsonFeed(TOPIC, data, { signer: testIdentity.privateKey })

        const hashedTopic = bee.makeFeedTopic(TOPIC)
        const reader = bee.makeFeedReader('sequence', hashedTopic, testIdentity.address)
        const chunkReferenceResponse = await reader.download()
        const downloadedData = await bee.downloadData(chunkReferenceResponse.reference)

        expect(downloadedData.json()).toEqual(data)
      },
      FEED_TIMEOUT,
    )

    it(
      'should get JSON from feed',
      async () => {
        const data = [{ some: { other: 'object' } }]

        const hashedTopic = bee.makeFeedTopic(TOPIC)
        const writer = bee.makeFeedWriter('sequence', hashedTopic, testIdentity.privateKey)
        const dataChunkReference = await bee.uploadData(JSON.stringify(data))
        await writer.upload(dataChunkReference)

        const fetchedData = await bee.getJsonFeed(TOPIC, { signer: testIdentity.privateKey })
        expect(fetchedData).toEqual(data)
      },
      FEED_TIMEOUT,
    )
  })
})
