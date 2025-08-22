import { Strings, Types } from 'cafe-utility'
import { Bytes, MerkleTree, Stamper } from '../../src'
import { makeBee } from '../utils'

test('Stamper utilization state', async () => {
  const bee = makeBee()

  const stamper = Stamper.fromBlank(
    Types.asString(process.env.JEST_BEE_SIGNER),
    Types.asString(process.env.JEST_EXTERNAL_BATCH_ID),
    17,
  )

  const payload = Bytes.fromUtf8(
    `Hello, client side stamper! This is a unique test payload: ${Strings.randomAlphanumeric(32)}`,
  )

  const tree = new MerkleTree(async chunk => {
    await bee.uploadChunk(stamper.stamp(chunk), chunk.build())
  })

  await tree.append(payload.toUint8Array())
  const rootChunk = await tree.finalize()

  const state = stamper.getState()
  expect(state).toHaveLength(65536)
  expect(state.reduce((a, b) => a + b)).toBe(1)

  const nextStamper = Stamper.fromState(
    Types.asString(process.env.JEST_BEE_SIGNER),
    Types.asString(process.env.JEST_EXTERNAL_BATCH_ID),
    state,
    17,
  )

  nextStamper.stamp(rootChunk)
  expect(() => nextStamper.stamp(rootChunk)).toThrow('Bucket is full')

  const data = await bee.downloadData(rootChunk.hash())
  expect(data.toUtf8()).toEqual(payload.toUtf8())
})
