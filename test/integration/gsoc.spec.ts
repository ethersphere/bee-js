import { Bytes, GsocSubscription, NULL_IDENTIFIER } from '../../src'
import { batch, makeBee } from '../utils'

test('GSOC - end to end test', async () => {
  const bee = makeBee()
  const identifier = NULL_IDENTIFIER
  const { overlay } = await bee.connectivity.getNodeAddresses()

  const signer = bee.messaging.gsocMine(overlay, identifier)

  const promise = new Promise<{ subscription: GsocSubscription; message: Bytes }>((resolve, reject) => {
    const subscription = bee.messaging.gsocSubscribe(signer.publicKey().address(), identifier, {
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

  await bee.messaging.gsocSend(batch(), signer, identifier, 'GSOC!')
  const { subscription, message } = await promise
  expect(message.toUtf8()).toBe('GSOC!')
  subscription.cancel()
})
