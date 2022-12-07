import * as bytes from '../../../src/modules/bytes'
import { invalidReference, ERR_TIMEOUT, getPostageBatch, beeKyOptions } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

describe('modules/bytes', () => {
  it('should store and retrieve data', async () => {
    const data = 'hello world'

    const result = await bytes.upload(BEE_KY_OPTIONS, data, getPostageBatch())
    const downloadedData = await bytes.download(BEE_KY_OPTIONS, result.reference)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })

  it(
    'should catch error',
    async () => {
      await expect(bytes.download(BEE_KY_OPTIONS, invalidReference)).rejects.toThrow('Not Found')
    },
    ERR_TIMEOUT,
  )
})
