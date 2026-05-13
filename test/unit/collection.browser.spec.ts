import { getFolderSize, makeCollectionFromFS } from '../../src/utils/collection.browser'

test('makeCollectionFromFS throws in browsers', async () => {
  await expect(makeCollectionFromFS('/some/dir')).rejects.toThrow(
    'Creating Collection from File System is not supported in browsers!',
  )
})

test('getFolderSize throws in browsers', async () => {
  await expect(getFolderSize('/some/dir')).rejects.toThrow(
    'Creating Collection from File System is not supported in browsers!',
  )
})
