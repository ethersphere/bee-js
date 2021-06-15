import { getCollectionSize, getFolderSize } from '../../../src/utils/collection'

function createFakeFile(): Partial<File> {
  return {
    size: 32,
  }
}

describe('collection', () => {
  test('should calculate folder size', async () => {
    const size = await getFolderSize('./test/data')

    expect(size).toBeGreaterThan(1)
  })

  test('should calculate collection size', async () => {
    const files: File[] = [createFakeFile() as File]
    const size = getCollectionSize(files)

    expect(size).toBe(32)
  })
})
