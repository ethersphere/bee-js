import { Binary } from 'cafe-utility'
import { Readable } from 'stream'
import { isReadable } from '../../src/utils/type'
import { batch, makeBee } from '../utils'

test('bee/2317 - Tag not updated when uploaded files using stream', async () => {
  const data = new BigUint64Array(4096) // 8 data chunks, 1 root chunk, 1 manifest, 2 nodes
  for (let i = 0; i < data.length; i++) {
    data[i] = BigInt(Math.random() * 2 ** 64)
  }

  const stream = new Readable({
    read() {
      for (const item of data) {
        this.push(Binary.numberToUint64(item, 'BE'))
      }
      this.push(null)
    },
  })

  expect(isReadable(stream)).toBe(true)

  const bee = makeBee()
  const { uid } = await bee.createTag()
  const result = await bee.uploadFile(batch(), stream, 'data.bin', { tag: uid })

  expect(result.tagUid).toBe(uid)
  const tag = await bee.retrieveTag(uid)
  expect(result.reference.toHex()).toBe(tag.address)
  expect(tag.split).toBe(12)
})
