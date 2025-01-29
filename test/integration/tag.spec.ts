import { batch, makeBee } from '../utils'

const bee = makeBee()

test('CRUD tags', async () => {
  const tag = await bee.createTag()
  await bee.uploadData(batch(), 'Tagged hello.', { tag: tag.uid })

  let offset = 0
  let tags = await bee.getAllTags({ offset })
  while (tags.length) {
    if (tags.some(x => x.uid === tag.uid)) {
      break
    }
    offset += tags.length
    tags = await bee.getAllTags({ offset })
  }
  expect(tags.some(x => x.uid === tag.uid)).toBe(true)

  const retrievedTag = await bee.retrieveTag(tag.uid)
  expect(retrievedTag.uid).toBe(tag.uid)
  expect(retrievedTag.split).toBe(1)

  await bee.deleteTag(tag.uid)
  const tagsAfterDelete = await bee.getAllTags()
  expect(tagsAfterDelete.some(x => x.uid === tag.uid)).toBe(false)
})
