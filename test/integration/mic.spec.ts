import { Strings } from 'cafe-utility'
import { Bytes, MicSubscription } from '../../src'
import { PrivateKey } from '../../src/utils/typed-bytes'
import { batch, makeBee } from '../utils'

test('MIC - end to end test', async () => {
  const bee = makeBee()
  const { overlay } = await bee.getNodeAddresses()

  // The owner is a fixed publisher identity; the identifier is mined so that the
  // chunk address lands in the subscriber's neighbourhood.
  const signer = new PrivateKey(Strings.randomHex(64))
  const identifier = bee.micMine(overlay, signer)

  const promise = new Promise<{ subscription: MicSubscription; message: Bytes }>((resolve, reject) => {
    const subscription = bee.micSubscribe(signer.publicKey().address(), {
      onMessage(message) {
        resolve({ subscription, message })
      },
      onError(error) {
        reject(error)
      },
      onClose() {
        void 0
      },
    })
  })

  await bee.makeSOCWriter(signer).upload(batch(), identifier, new TextEncoder().encode('MIC!'))
  const { subscription, message } = await promise
  expect(message.toUtf8()).toBe('MIC!')
  subscription.cancel()
})
