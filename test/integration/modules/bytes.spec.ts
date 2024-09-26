import * as bytes from '../../../src/modules/bytes'
import { beeKyOptions, getPostageBatch, invalidReference } from '../../utils'

const BEE_REQUEST_OPTIONS = beeKyOptions()

describe('modules/bytes', () => {
  it('should store and retrieve data', async function () {
    const data = 'hello world'

    const result = await bytes.upload(BEE_REQUEST_OPTIONS, data, getPostageBatch())
    const downloadedData = await bytes.download(BEE_REQUEST_OPTIONS, result.reference)

    expect(Buffer.from(downloadedData).toString()).toBe(data)
  })

  it('should catch error', async function () {
    await expect(bytes.download(BEE_REQUEST_OPTIONS, invalidReference)).rejects.toThrow(
      'Request failed with status code 404',
    )
  })
})
