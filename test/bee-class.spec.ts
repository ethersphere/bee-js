import { Bee, BeeDebug, Collection } from '../src'
import { BeeArgumentError } from '../src/utils/error'

import { ChunkReference } from '../src/feed'
import { HEX_REFERENCE_LENGTH } from '../src/types'
import { makeBytes } from '../src/utils/bytes'
import { bytesToHex, HexString } from '../src/utils/hex'
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
} from './utils'
import { makeSigner } from '../src/chunk/signer'
import { makeSOCAddress, uploadSingleOwnerChunkData } from '../src/chunk/soc'
import { makeEthAddress } from '../src/utils/eth'
import * as collection from '../src/modules/collection'

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

      expect(hash.length).toEqual(HEX_REFERENCE_LENGTH)
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
    it('should pin and unpin files', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinFile(hash)
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

        const address = await beeDebug.getOverlayAddress()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, address, message)
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

        const address = await beeDebug.getOverlayAddress()
        const pssPublicKey = await beeDebug.getPssPublicKey()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, address, message, pssPublicKey)
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

        const address = await beeDebug.getOverlayAddress()
        const beePeer = new Bee(beePeerUrl())
        await beePeer.pssSend(topic, address, message)
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
})
