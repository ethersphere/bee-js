import * as bytes from '../../../src/modules/bytes'
import { invalidReference, ERR_TIMEOUT, getPostageBatch, beeKy } from '../../utils'

const BEE_KY = beeKy()

describe('modules/bytes', () => {
  it('should store and retrieve data', async () => {
    const data = 'hello world'

    const hash = await bytes.upload(BEE_KY, data, getPostageBatch())
    const downloadedData = await bytes.download(BEE_KY, hash)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })

  it(
    'should catch error',
    async () => {
      await expect(bytes.download(BEE_KY, invalidReference)).rejects.toThrow('Not Found')
    },
    ERR_TIMEOUT,
  )
})
