import { batch, makeBee } from '../utils'

const bee = makeBee()

test('CRUD tags', async () => {
  const tag = await bee.tag.create()
  await bee.upload.data(batch(), 'Tagged hello.', { tag: tag.uid })

  let offset = 0
  let tags = await bee.tag.getAll({ offset })
  while (tags.length) {
    if (tags.some(x => x.uid === tag.uid)) {
      break
    }
    offset += tags.length
    tags = await bee.tag.getAll({ offset })
  }
  expect(tags.some(x => x.uid === tag.uid)).toBe(true)

  const retrievedTag = await bee.tag.get(tag.uid)
  expect(retrievedTag.uid).toBe(tag.uid)
  expect(retrievedTag.split).toBe(3)

  await bee.tag.delete(tag.uid)
  const tagsAfterDelete = await bee.tag.getAll()
  expect(tagsAfterDelete.some(x => x.uid === tag.uid)).toBe(false)
})
