import { join } from 'path'
import { beeDebugUrl, beePeerUrl, beeUrl, commonMatchers, PSS_TIMEOUT } from './utils'
import '../src'

commonMatchers()

describe('Bee class - in browser', () => {
  const BEE_URL = beeUrl()
  const BEE_DEBUG_URL = beeDebugUrl()
  const BEE_PEER_URL = beePeerUrl()

  beforeAll(async done => {
    await jestPuppeteer.resetPage()
    const testPage = join(__dirname, 'testpage', 'testpage.html')
    await page.goto(`file://${testPage}`)

    done()
  })

  it('should create a new Bee instance in browser', async () => {
    const testBeeInstance = await page.evaluate(BEE_URL => {
      return new window.BeeJs.Bee(BEE_URL)
    }, BEE_URL)

    expect(testBeeInstance.url).toBe(BEE_URL)
  })

  it('should pin and unpin collection', async () => {
    const fileHash = await page.evaluate(async BEE_URL => {
      const bee = new window.BeeJs.Bee(BEE_URL)
      const files: File[] = [new File(['hello'], 'hello')]

      return await bee.uploadFiles(files)
    }, BEE_URL)
    expect(fileHash).toBeHashReference()
    //pinning
    const pinResult = await page.evaluate(
      async (BEE_URL, fileHash) => {
        const bee = new window.BeeJs.Bee(BEE_URL)

        return await bee.pinFile(fileHash)
      },
      BEE_URL,
      fileHash,
    )
    expect(pinResult).toBeBeeResponse(200)
    //unpinning
    const unpinResult = await page.evaluate(
      async (BEE_URL, fileHash) => {
        const bee = new window.BeeJs.Bee(BEE_URL)

        return await bee.unpinFile(fileHash)
      },
      BEE_URL,
      fileHash,
    )
    expect(pinResult).toBeBeeResponse(200)
    expect(unpinResult).toBeBeeResponse(200)
  })

  it('should get state of uploading on uploading file', async () => {
    const uploadEvent = await page.evaluate(async BEE_URL => {
      const bee = new window.BeeJs.Bee(BEE_URL)
      const filename = 'hello.txt'
      const data = new Uint8Array([1, 2, 3, 4])

      let uploadEvent: { loaded: number; total: number } = {
        loaded: 0,
        total: 4,
      }

      await bee.uploadFile(data, filename, {
        contentType: 'text/html',
        axiosOptions: {
          onUploadProgress: ({ loaded, total }) => {
            uploadEvent = { loaded, total }
          },
        },
      })

      return uploadEvent
    }, BEE_URL)

    expect(uploadEvent).toEqual({ loaded: 4, total: 4 })
  })
  describe('pss', () => {
    it(
      'should send and receive pss message',
      async done => {
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message) => {
            const topic = 'bee-class-topic'

            const bee = new window.BeeJs.Bee(BEE_URL)
            const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

            const address = await beeDebug.getOverlayAddress()
            const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

            const receive = bee.pssReceive(topic)
            await beePeer.pssSend(topic, address, message)

            const msg = await receive

            // Need to pass it back as string
            return new TextDecoder('utf-8').decode(new Uint8Array(msg))
          },
          BEE_URL,
          BEE_DEBUG_URL,
          BEE_PEER_URL,
          message,
        )

        expect(result).toEqual(message)
        done()
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive pss message',
      async done => {
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message) => {
            const topic = 'bee-class-topic'

            const bee = new window.BeeJs.Bee(BEE_URL)
            const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

            const pssPublicKey = await beeDebug.getPssPublicKey()
            const address = await beeDebug.getOverlayAddress()
            const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

            const receive = bee.pssReceive(topic)
            await beePeer.pssSend(topic, address, message, pssPublicKey)

            const msg = await receive

            // Need to pass it back as string
            return new TextDecoder('utf-8').decode(new Uint8Array(msg))
          },
          BEE_URL,
          BEE_DEBUG_URL,
          BEE_PEER_URL,
          message,
        )

        expect(result).toEqual(message)
        done()
      },
      PSS_TIMEOUT,
    )
  })
})
