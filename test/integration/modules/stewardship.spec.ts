import * as bzz from '../../../src/modules/bzz'
import * as stewardship from '../../../src/modules/stewardship'
import { Collection } from '../../../src/types'
import { beeUrl, getPostageBatch } from '../../utils'

const BEE_URL = beeUrl()

describe('modules/stewardship', () => {
  describe('collections', () => {
    it('should reupload directory', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const hash = await bzz.uploadCollection(BEE_URL, directoryStructure, getPostageBatch(), { pin: true })
      await stewardship.reupload(BEE_URL, hash) // Does not return anything, but will throw error if something is wrong
    })
  })

  describe('file', () => {
    it('should reupload file', async () => {
      const data = 'hello world'
      const filename = 'hello.txt'

      const hash = await bzz.uploadFile(BEE_URL, data, getPostageBatch(), filename, { pin: true })
      await stewardship.reupload(BEE_URL, hash) // Does not return anything, but will throw error if something is wrong
    })
  })
})
