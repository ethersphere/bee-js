import * as bytes from '../../src/modules/bytes'
import { beeUrl } from '../utils'

const BEE_URL = beeUrl()

describe('modules/bytes', () => {
  it('should store and retrieve data', async () => {
    const data = 'hello world'

    const hash = await bytes.upload(BEE_URL, data)
    const downloadedData = await bytes.download(BEE_URL, hash)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })

  it('should catch error', async () => {
    const invalidReference = '0000000000000000000000000000000000000000000000000000000000000000'

    await expect(bytes.download(BEE_URL, invalidReference)).rejects.toThrow('Not Found')
  })
})
