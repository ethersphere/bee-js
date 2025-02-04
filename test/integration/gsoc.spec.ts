import { Bytes, GsocSubscription } from '../../src'
import { batch, makeBee } from '../utils'

test('gsoc', async () => {
  const bee = makeBee()
  const identifier = new Uint8Array(32)
  const { overlay } = await bee.getNodeAddresses()

  const signer = bee.gsocMine(overlay, identifier)

  const promise = new Promise<{ subscription: GsocSubscription; message: Bytes }>((resolve, reject) => {
    const subscription = bee.gsocSubscribe(signer.publicKey().address(), identifier, {
      onMessage(message) {
        resolve({ subscription, message })
      },
      onError(error) {
        reject(error)
      },
    })
  })

  await bee.gsocSend(batch(), signer, identifier, 'GSOC!')
  const { subscription, message } = await promise
  expect(message.toUtf8()).toBe('GSOC!')
  subscription.cancel()
})
