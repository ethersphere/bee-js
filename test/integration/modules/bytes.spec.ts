import { expect } from 'chai'
import * as bytes from '../../../src/modules/bytes'
import { beeKyOptions, ERR_TIMEOUT, getPostageBatch, invalidReference } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

describe('modules/bytes', () => {
  it('should store and retrieve data', async function () {
    const data = 'hello world'

    const result = await bytes.upload(BEE_KY_OPTIONS, data, getPostageBatch())
    const downloadedData = await bytes.download(BEE_KY_OPTIONS, result.reference)

    expect(Buffer.from(downloadedData).toString()).to.eql(data)
  })

  it('should catch error', async function () {
    this.timeout(ERR_TIMEOUT)
    await expect(bytes.download(BEE_KY_OPTIONS, invalidReference)).rejectedWith('Not Found')
  })
})
