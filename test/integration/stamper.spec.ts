import { Types } from 'cafe-utility'
import { Bytes, MerkleTree, Stamper } from '../../src'
import { makeBee } from '../utils'

test('Stamper', async () => {
  const bee = makeBee()

  const stamper = Stamper.fromBlank(
    Types.asString(process.env.JEST_BEE_FULL_PK),
    'ae0b4d8548d17fb70672c5e7a9717de5f855d3f398a3cc2f0e445e2eecca2622',
    17,
  )

  const payload = Bytes.fromUtf8('Hello, client side stamper!')

  const tree = new MerkleTree(async chunk => {
    await bee.uploadChunk(stamper.stamp(chunk), chunk.build())
  })

  await tree.append(payload.toUint8Array())
  const rootChunk = await tree.finalize()

  const state = stamper.getState()
  expect(state).toHaveLength(65536)
  expect(state.reduce((a, b) => a + b)).toBe(1)

  const nextStamper = Stamper.fromState(
    Types.asString(process.env.JEST_BEE_FULL_PK),
    'ae0b4d8548d17fb70672c5e7a9717de5f855d3f398a3cc2f0e445e2eecca2622',
    state,
    17,
  )

  nextStamper.stamp(rootChunk)
  expect(() => nextStamper.stamp(rootChunk)).toThrow('Bucket is full')
})
