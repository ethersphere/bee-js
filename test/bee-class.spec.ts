import Bee, { BeeDebug } from '../src'
import { makeDefaultSigner } from '../src/chunk/signer'
import { REFERENCE_LENGTH } from '../src/types'
import { verifyBytes } from '../src/utils/bytes'
import { hexToBytes } from '../src/utils/hex'
import { beeDebugUrl, beePeerUrl, beeUrl, okResponse, PSS_TIMEOUT, testChunkPayload, testIdentity } from './utils'

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
    it('should pin and unping files', async () => {
      const content = new Uint8Array([1, 2, 3])

      const hash = await bee.uploadFile(content)

      const pinResponse = await bee.pinFile(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinFile(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unping collection', async () => {
      const path = './test/data/'
      const hash = await bee.uploadFilesFromDirectory(path)

      const pinResponse = await bee.pinCollection(hash)
      expect(pinResponse).toEqual(okResponse)

      const unpinResponse = await bee.unpinCollection(hash)
      expect(unpinResponse).toEqual(okResponse)
    })

    it('should pin and unping data', async () => {
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

  describe('soc', () => {
    it('should read and write', async () => {
      const privateKey = verifyBytes(32, hexToBytes(testIdentity.privateKey))
      const signer = makeDefaultSigner(privateKey)
      const socWriter = bee.makeSOCWriter(signer)
      const identifier = verifyBytes(32, new Uint8Array(32))

      const uploadResponse = await socWriter.upload(identifier, testChunkPayload)
      expect(uploadResponse).toEqual(okResponse)

      const soc = await socWriter.download(identifier)
      const payload = soc.payload()
      expect(payload).toEqual(testChunkPayload)
    })
  })
})
