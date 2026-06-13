import { Bytes, MocSubscription, NULL_IDENTIFIER } from '../../src'
import { batch, makeBee } from '../utils'

test('MOC - end to end test', async () => {
  const bee = makeBee()
  const identifier = NULL_IDENTIFIER
  const { overlay } = await bee.getNodeAddresses()

  // The identifier is the shared topic; the owner is an ephemeral key mined so that
  // the chunk address lands in the subscriber's neighbourhood.
  const signer = bee.gsocMine(overlay, identifier)

  const promise = new Promise<{ subscription: MocSubscription; message: Bytes }>((resolve, reject) => {
    const subscription = bee.mocSubscribe(identifier, {
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

  await bee.makeSOCWriter(signer).upload(batch(), identifier, new TextEncoder().encode('MOC!'))
  const { subscription, message } = await promise
  expect(message.toUtf8()).toBe('MOC!')
  subscription.cancel()
})
