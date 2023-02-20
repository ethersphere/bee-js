import { Utils } from '../../../src'
import { expect } from 'chai'

function createFakeFile(): Partial<File> {
  return {
    size: 32,
  }
}

describe('collection', () => {
  it('should calculate folder size', async function () {
    const size = await Utils.getFolderSize('./test/data')

    expect(size).above(1)
  })

  it('should calculate collection size', async function () {
    const files: File[] = [createFakeFile() as File]
    const size = Utils.getCollectionSize(files)

    expect(size).to.eql(32)
  })
})
