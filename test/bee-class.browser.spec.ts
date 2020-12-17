import { join } from 'path'
import { beeUrl } from './utils'

describe('Bee class - in browser', () => {
  beforeAll(async done => {
    const testPage = join(__dirname, 'testpage', 'testpage.html')
    await page.goto(`file://${testPage}`)

    done()
  })

  it('should reach the "bee" object globally, which holds the correct connection URL', async () => {
    const browserBeeUrl = await page.evaluate(() => {
      return window.bee.url
    })

    expect(browserBeeUrl).toBe(beeUrl())
  })

  it('should pin and unping collection', async () => {
    const fileHash = await page.evaluate(async () => {
      const files: File[] = [new File(['hello'], 'hello')]

      return await window.bee.uploadFiles(files)
    })
    expect(typeof fileHash).toBe('string') //TODO: write own matcher to check swarm hashes
    //pinning
    const pinResult = await page.evaluate(async fileHash => {
      return await window.bee.pinFile(fileHash)
    }, fileHash)
    expect(pinResult.code).toBe(200) //TODO: write own matcher to handle Bee client response messages
    //unpinning
    const unpinResult = await page.evaluate(async fileHash => {
      return await window.bee.unpinFile(fileHash)
    }, fileHash)
    expect(unpinResult.code).toBe(200)
  })
})
