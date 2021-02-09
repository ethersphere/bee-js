import { join } from 'path'
import { beeUrl, commonMatchers, randomByteArray } from './utils'
import '../src'

commonMatchers()

describe('Bee class - in browser', () => {
  const BEE_URL = beeUrl()

  beforeAll(async done => {
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
      // eslint-disable-next-line prettier/prettier
      let uploadEvent: { loaded: number, total: number } = {
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
})
