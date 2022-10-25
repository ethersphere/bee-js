import * as chunk from '../../../src/modules/chunk'
import { invalidReference, ERR_TIMEOUT, getPostageBatch, beeKy } from '../../utils'

const BEE_KY = beeKy()

describe('modules/chunk', () => {
  it('should store and retrieve data', async () => {
    const payload = new Uint8Array([1, 2, 3])
    // span is the payload length encoded as uint64 little endian
    const span = new Uint8Array([payload.length, 0, 0, 0, 0, 0, 0, 0])
    const data = new Uint8Array([...span, ...payload])
    // the hash is hardcoded because we would need the bmt hasher otherwise
    const reference = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

    const response = await chunk.upload(BEE_KY, data, getPostageBatch())
    expect(response).toEqual(reference)

    const downloadedData = await chunk.download(BEE_KY, response)
    expect(downloadedData.bytes()).toEqual(data)
  })

  it(
    'should catch error',
    async () => {
      await expect(chunk.download(BEE_KY, invalidReference)).rejects.toThrow('Not Found')
    },
    ERR_TIMEOUT,
  )
})
