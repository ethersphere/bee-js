import { join } from 'path'
import {
  beeDebugUrl,
  beeKy,
  beePeerDebugUrl,
  beePeerUrl,
  beeUrl,
  commonMatchers,
  getPostageBatch,
  PSS_TIMEOUT,
} from '../utils'
import '../../src'
import type { Address, Reference } from '../../src/types'
import * as bzz from '../../src/modules/bzz'

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

    batchId = await getPostageBatch()
    batchIdPeer = await getPostageBatch(beePeerDebugUrl())
  })

  it('should create a new Bee instance in browser', async () => {
    const beeUrl = await page.evaluate(BEE_URL => {
      return new window.BeeJs.Bee(BEE_URL).url
    }, BEE_URL)

    expect(beeUrl).toBe(BEE_URL)
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

        return (await bee.uploadFiles(batchId, files)).reference
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

  describe('streams', () => {
    it('should upload file with stream', async () => {
      const ref = (await page.evaluate(
        async (BEE_URL, batchId) => {
          // @ts-ignore: This is evaluated in browser context - no TS support
          function createReadableStream(iterable) {
            const iter = iterable[Symbol.iterator]()

            return new ReadableStream({
              async pull(controller) {
                const result = iter.next()

                if (result.done) {
                  controller.close()

                  return
                }

                controller.enqueue(result.value)
              },
            })
          }

          const bee = new window.BeeJs.Bee(BEE_URL)
          const filename = 'hello.txt'
          const readable = createReadableStream([
            new TextEncoder().encode('hello '),
            new TextEncoder().encode('another world'),
          ])

          const reference = await bee.uploadFile(batchId, readable, filename, {
            contentType: 'text/plain',
          })

          return reference.reference
        },
        BEE_URL,
        batchId,
      )) as Reference

      const file = await bzz.downloadFile(beeKy(), ref)

      expect(file.name).toEqual('hello.txt')
      expect(file.data.text()).toEqual('hello another world')
    })

    it('should download file with stream', async () => {
      const result = await bzz.uploadFile(beeKy(), 'hello awesome world', batchId)

      const content = (await page.evaluate(
        async (BEE_URL, reference) => {
          const bee = new window.BeeJs.Bee(BEE_URL)
          const readable = await bee.downloadReadableFile(reference)

          const reader = readable.data.getReader()
          const buffers = []

          let done, value
          do {
            ;({ done, value } = await reader.read())

            if (!done) {
              buffers.push(value)
            }
          } while (!done)

          // @ts-ignore: Browser context - no TS
          const blob = new Blob(buffers, { type: 'application/octet-stream' })

          return new TextDecoder().decode(await blob.arrayBuffer())
        },
        BEE_URL,
        result.reference,
      )) as string

      expect(content).toEqual('hello awesome world')
    })
  })

  describe('pss', () => {
    it(
      'should send and receive pss message',
      done => {
        // Jest does not allow use `done` and return Promise so this wrapper work arounds that.
        ;(async () => {
          const message = '1234'

          const result = await page.evaluate(
            async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
              const topic = 'browser-bee-class-topic1'

              const bee = new window.BeeJs.Bee(BEE_URL)
              const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

              const { overlay } = await beeDebug.getNodeAddresses()
              const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

              const receive = bee.pssReceive(topic)
              await beePeer.pssSend(batchIdPeer, topic, overlay.slice(0, 2), message) // We don't have the `makeTestTarget` utility available in this context

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
        })()
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive pss message encrypted with PSS key',
      done => {
        // Jest does not allow use `done` and return Promise so this wrapper work arounds that.
        ;(async () => {
          const message = '1234'

          const result = await page.evaluate(
            async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
              const topic = 'browser-bee-class-topic2'

              const bee = new window.BeeJs.Bee(BEE_URL)
              const beeDebug = new window.BeeJs.BeeDebug(BEE_DEBUG_URL)

              const { overlay, pssPublicKey } = await beeDebug.getNodeAddresses()
              const beePeer = new window.BeeJs.Bee(BEE_PEER_URL)

              const receive = bee.pssReceive(topic)
              await beePeer.pssSend(
                batchIdPeer,
                topic,
                overlay.slice(0, 2), // We don't have the `makeTestTarget` utility available in this context
                message,
                pssPublicKey,
              )

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
        })()
      },
      PSS_TIMEOUT,
    )
  })
})
