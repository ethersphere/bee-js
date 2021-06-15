import { Utils } from '../../../src'

function createFakeFile(): Partial<File> {
  return {
    size: 32,
  }
}

describe('collection', () => {
  test('should calculate folder size', async () => {
    const size = await Utils.Collections.getFolderSize('./test/data')

    expect(size).toBeGreaterThan(1)
  })

  test('should calculate collection size', async () => {
    const files: File[] = [createFakeFile() as File]
    const size = Utils.Collections.getCollectionSize(files)

    expect(size).toBe(32)
  })
})
