import { join } from 'path'
import '../../src'
import type { Address } from '../../src/types'
import { beeDebugUrl, beePeerUrl, beeUrl, commonMatchers, getPostageBatch, PSS_TIMEOUT } from '../utils'

commonMatchers()

describe('Bee class - in browser', () => {
  const BEE_URL = beeUrl()
  const BEE_DEBUG_URL = beeDebugUrl()
  const BEE_PEER_URL = beePeerUrl()
  let batchId: Address, batchIdPeer: Address

  beforeAll(async () => {
    await jestPuppeteer.resetPage()
    const testPage = join(__dirname, '..', 'testpage', 'testpage.html')
    await page.goto(`file://${testPage}`)

    // This will create the default batch if it is was not created before
    batchId = await getPostageBatch()
    batchIdPeer = await getPostageBatch(BEE_PEER_URL)
  })

  it('should create a new Bee instance in browser', async () => {
    const testBeeInstance = await page.evaluate(BEE_URL => {
      return new window.BeeJs.Bee(BEE_URL)
    }, BEE_URL)

    expect(testBeeInstance.url).toBe(BEE_URL)
  })

  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, async () => {
      await page.evaluate(url => {
        try {
          new window.BeeJs.Bee(url as string)
          fail('Bee constructor should have thrown error.')
        } catch (e) {
          if (e instanceof window.BeeJs.BeeArgumentError) {
            // We don't have `expect()` available in browser context
            if (e.value !== url) {
              throw new Error('Error value does not match the URL!')
            }

            return
          }

          throw e
        }
      }, url as string)
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

  it('should pin and unpin collection', async () => {
    const fileHash = await page.evaluate(
      async (BEE_URL, batchId) => {
        const bee = new window.BeeJs.Bee(BEE_URL)
        const files: File[] = [new File(['hello'], 'hello')]

        return await bee.uploadFiles(batchId, files)
      },
      BEE_URL,
      batchId,
    )
    expect(fileHash).toBeHashReference()
    //pinning
    await page.evaluate(
      async (BEE_URL, fileHash) => {
        const bee = new window.BeeJs.Bee(BEE_URL)

        return await bee.pin(fileHash)
      },
      BEE_URL,
      fileHash,
    )

    //unpinning
    await page.evaluate(
      async (BEE_URL, fileHash) => {
        const bee = new window.BeeJs.Bee(BEE_URL)

        return await bee.unpin(fileHash)
      },
      BEE_URL,
      fileHash,
    )
  })

  it('should get state of uploading on uploading file', async () => {
    const uploadEvent = await page.evaluate(
      async (BEE_URL, batchId) => {
        const bee = new window.BeeJs.Bee(BEE_URL)
        const filename = 'hello.txt'
        const data = new Uint8Array([1, 2, 3, 4])

        let uploadEvent: { loaded: number; total: number } = {
          loaded: 0,
          total: 4,
        }

        await bee.uploadFile(batchId, data, filename, {
          contentType: 'text/html',
          axiosOptions: {
            onUploadProgress: ({ loaded, total }) => {
              uploadEvent = { loaded, total }
            },
          },
        })

        return uploadEvent
      },
      BEE_URL,
      batchId,
    )

    expect(uploadEvent).toEqual({ loaded: 4, total: 4 })
  })

  describe('pss', () => {
    it(
      'should send and receive pss message',
      async done => {
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
            const topic = 'browser-bee-class-topic1'

            const bee = new window.BeeJs.Bee(BEE_URL)
            const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

            const { overlay } = await beeDebug.getNodeAddresses()
            const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

            const receive = bee.pssReceive(topic)
            await beePeer.pssSend(batchIdPeer, topic, overlay, message)

            const msg = await receive

            // Need to pass it back as string
            return new TextDecoder('utf-8').decode(new Uint8Array(msg))
          },
          BEE_URL,
          BEE_DEBUG_URL,
          BEE_PEER_URL,
          message,
          batchIdPeer,
        )

        expect(result).toEqual(message)
        done()
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive pss message encrypted with PSS key',
      async done => {
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
            const topic = 'browser-bee-class-topic2'

            const bee = new window.BeeJs.Bee(BEE_URL)
            const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

            const { overlay, pssPublicKey } = await beeDebug.getNodeAddresses()
            const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

            const receive = bee.pssReceive(topic)
            await beePeer.pssSend(batchIdPeer, topic, overlay, message, pssPublicKey)

            const msg = await receive

            // Need to pass it back as string
            return new TextDecoder('utf-8').decode(new Uint8Array(msg))
          },
          BEE_URL,
          BEE_DEBUG_URL,
          BEE_PEER_URL,
          message,
          batchIdPeer,
        )

        expect(result).toEqual(message)
        done()
      },
      PSS_TIMEOUT,
    )

    it('should calculate collection size', async () => {
      const size = await page.evaluate(async BEE_URL => {
        const bee = new window.BeeJs.Bee(BEE_URL)
        const files: File[] = [new File(['hello'], 'hello')]

        return await bee.getCollectionSize(files)
      }, BEE_URL)

      expect(size).toBeGreaterThan(1)
    })
  })
})
