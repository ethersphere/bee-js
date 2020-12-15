import Bee from '../src'
import { beeUrl } from './utils'

describe('Bee class', () => {
  const BEE_URL = beeUrl()
  const bee = new Bee(BEE_URL)

  it('should pin and unping collection', async () => {
    const files: File[] = [new File(['hello'], 'hello')]
    const hash = await bee.uploadFiles(files)
    await bee.pinCollection(hash)
    await bee.unpinCollection(hash)
  })
})
