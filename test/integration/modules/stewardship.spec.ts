import * as bzz from '../../../src/modules/bzz'
import * as stewardship from '../../../src/modules/stewardship'
import { Collection } from '../../../src/types'
import { beeKyOptions, getPostageBatch } from '../../utils'

const BEE_REQUEST_OPTIONS = beeKyOptions()

// TODO: Bee 400
describe.skip('modules/stewardship', () => {
  describe('collections', () => {
    it('should reupload directory', async function () {
      const directoryStructure: Collection = [
        {
          path: '0',
          fsPath: 'test/primitives/byte-00.bin',
          size: 1,
        },
      ]

      const result = await bzz.uploadCollection(BEE_REQUEST_OPTIONS, directoryStructure, getPostageBatch(), {
        pin: true,
      })
      await stewardship.reupload(BEE_REQUEST_OPTIONS, result.reference) // Does not return anything, but will throw error if something is wrong
    })
  })

  describe('file', () => {
    it('should reupload file', async function () {
      const data = 'hello world'
      const filename = 'hello.txt'

      const result = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), filename, { pin: true })
      await stewardship.reupload(BEE_REQUEST_OPTIONS, result.reference) // Does not return anything, but will throw error if something is wrong
    })
  })
})
