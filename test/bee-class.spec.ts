import { randomBytes } from 'crypto'
import { Bee, BeeDebug } from '../src'
import { EthAddress, makeDefaultSigner, PrivateKey } from '../src/chunk/signer'
import { ChunkReference, Topic, verifyChunkReference } from '../src/feed'
import { REFERENCE_LENGTH } from '../src/types'
import { makeBytes } from '../src/utils/bytes'
import { bytesToHex, HexString, hexToBytes, stripHexPrefix } from '../src/utils/hex'
import { beeDebugUrl, beePeerUrl, beeUrl, okResponse, PSS_TIMEOUT, randomByteArray, testIdentity } from './utils'

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

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
      const name = 'hello.txt'
      const type = 'text/plain'
      const file = ({
        arrayBuffer: () => content,
        name,
        type,
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

      expect(hash.length).toEqual(REFERENCE_LENGTH)
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
    const owner = hexToBytes(testIdentity.address) as EthAddress
    const signer = makeDefaultSigner(hexToBytes(testIdentity.privateKey) as PrivateKey)
    // const topic = hexToBytes('0000000000000000000000000000000000000000000000000000000000000000' as HexString) as Topic
    const topic = randomByteArray(32, Date.now()) as Topic

    test.skip('create feed reader and manifest', async () => {
      const feed = bee.makeFeedReader(owner, topic)
      const manifestResponse = await feed.createManifest()
      expect(typeof manifestResponse.reference).toBe('string')
    })

    test('feed writer with two updates', async () => {
      const feed = bee.makeFeedWriter(signer, topic)
      const zeroReference = makeBytes(32) // all zeroes

      await feed.upload(zeroReference)
      const firstUpdateReferenceResponse = await feed.download()

      expect(firstUpdateReferenceResponse.reference).toEqual(bytesToHex(zeroReference))

      const oneReference = new Uint8Array([...new Uint8Array([1]), ...new Uint8Array(31)]) as ChunkReference

      await feed.upload(oneReference)
      const secondUpdateReferenceResponse = await feed.download()

      console.debug({firstUpdateReferenceResponse, secondUpdateReferenceResponse})

      expect(secondUpdateReferenceResponse.reference).toEqual(bytesToHex(oneReference))
    }, 35000)
  })
})
