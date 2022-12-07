import * as bzz from '../../../src/modules/bzz'
import * as stewardship from '../../../src/modules/stewardship'
import { Collection } from '../../../src/types'
import { beeKyOptions, getPostageBatch } from '../../utils'

const BEE_KY_OPTIONS = beeKyOptions()

describe('modules/stewardship', () => {
  describe('collections', () => {
    it('should reupload directory', async () => {
      const directoryStructure: Collection<Uint8Array> = [
        {
          path: '0',
          data: Uint8Array.from([0]),
        },
      ]

      const result = await bzz.uploadCollection(BEE_KY_OPTIONS, directoryStructure, getPostageBatch(), { pin: true })
      await stewardship.reupload(BEE_KY_OPTIONS, result.reference) // Does not return anything, but will throw error if something is wrong
    })
  })

  describe('file', () => {
    it('should reupload file', async () => {
      const data = 'hello world'
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_KY_OPTIONS, data, getPostageBatch(), filename, { pin: true })
      await stewardship.reupload(BEE_KY_OPTIONS, result.reference) // Does not return anything, but will throw error if something is wrong
    })
  })
})
