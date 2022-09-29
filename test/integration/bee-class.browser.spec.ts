import { join } from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

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
import * as bzz from '../../src/modules/bzz'

import type { Reference, Address } from '../../src/types'

commonMatchers()

const __dirname = dirname(fileURLToPath(import.meta.url))

declare global {
  interface Window {
    getBundlePath: () => string
  }
}

describe('Bee class - in browser', () => {
  const BEE_URL = beeUrl()
  const BEE_DEBUG_URL = beeDebugUrl()
  const BEE_PEER_URL = beePeerUrl()
  let batchId: Address, batchIdPeer: Address

  beforeAll(async () => {
    await jestPuppeteer.resetPage()
    await page.exposeFunction(
      'getBundlePath',
      () => `file://${join(__dirname, '..', '..', 'dist', 'index.browser.js')}`,
    )

    const testPage = join(__dirname, '..', 'testpage', 'testpage.html')
    await page.goto(`file://${testPage}`)

    batchId = await getPostageBatch()
    batchIdPeer = await getPostageBatch(beePeerDebugUrl())
  })

  it('should create a new Bee instance in browser', async () => {
    const beeUrl = await page.evaluate(async BEE_URL => {
      const { Bee } = await import(await window.getBundlePath())

      return new Bee(BEE_URL).url
    }, BEE_URL)

    expect(beeUrl).toBe(BEE_URL)
  })

  function testUrl(url: unknown): void {
    it(`should not accept invalid url '${url}'`, async () => {
      await page.evaluate(async url => {
        const { Bee, BeeArgumentError } = await import(await window.getBundlePath())

        try {
          new Bee(url as string)
          fail('Bee constructor should have thrown error.')
        } catch (e) {
          if (e instanceof BeeArgumentError) {
            // We don't have `expect()` available in browser context
            if ((e as typeof BeeArgumentError).value !== url) {
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
        const { Bee } = await import(await window.getBundlePath())

        const bee = new Bee(BEE_URL)
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
        const { Bee } = await import(await window.getBundlePath())

        const bee = new Bee(BEE_URL)

        return await bee.pin(fileHash)
      },
      BEE_URL,
      fileHash,
    )

    //unpinning
    await page.evaluate(
      async (BEE_URL, fileHash) => {
        const { Bee } = await import(await window.getBundlePath())

        const bee = new Bee(BEE_URL)

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
          const { Bee } = await import(await window.getBundlePath())

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

          const bee = new Bee(BEE_URL)
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
      const content = (await page.evaluate(
        async (BEE_URL, batchId) => {
          const { Bee } = await import(await window.getBundlePath())

          const bee = new Bee(BEE_URL)

          const { reference } = await bee.uploadFile(batchId, 'hello awesome world')

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
        batchId,
      )) as string

      expect(content).toEqual('hello awesome world')
    })
  })

  describe('pss', () => {
    it(
      'should send and receive pss message',
      async () => {
        // Jest does not allow use `done` and return Promise so this wrapper work arounds that.
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
            const { Bee, BeeDebug } = await import(await window.getBundlePath())

            const topic = 'browser-bee-class-topic1'

            const bee = new Bee(BEE_URL)
            const beeDebug = new BeeDebug(BEE_DEBUG_URL)

            const { overlay } = await beeDebug.getNodeAddresses()
            const beePeer = new Bee(BEE_PEER_URL)

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
      },
      PSS_TIMEOUT,
    )

    it(
      'should send and receive pss message encrypted with PSS key',
      async () => {
        const message = '1234'

        const result = await page.evaluate(
          async (BEE_URL, BEE_DEBUG_URL, BEE_PEER_URL, message, batchIdPeer) => {
            const { Bee, BeeDebug } = await import(await window.getBundlePath())

            const topic = 'browser-bee-class-topic2'

            const bee = new Bee(BEE_URL)
            const beeDebug = new BeeDebug(BEE_DEBUG_URL)

            const { overlay, pssPublicKey } = await beeDebug.getNodeAddresses()
            const beePeer = new Bee(BEE_PEER_URL)

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
      },
      PSS_TIMEOUT,
    )
  })
})
