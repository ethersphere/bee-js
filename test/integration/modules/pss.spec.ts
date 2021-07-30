import * as pss from '../../../src/modules/pss'
import * as connectivity from '../../../src/modules/debug/connectivity'
import { beeDebugUrl, beePeerDebugUrl, beePeerUrl, beeUrl, getPostageBatch, PSS_TIMEOUT } from '../../utils'

const BEE_URL = beeUrl()
const BEE_PEER_URL = beePeerUrl()
const BEE_DEBUG_PEER_URL = beePeerDebugUrl()

// these tests only work when there is at least one peer connected
describe('modules/pss', () => {
  it(
    'should send PSS message',
    async () => {
      const topic = 'send-pss-message'
      const message = 'hello'

      const debugUrl = beeDebugUrl()
      const peers = await connectivity.getPeers(debugUrl)
      expect(peers.length).toBeGreaterThan(0)

      const target = peers[0].address
      await pss.send(BEE_URL, topic, target, message, getPostageBatch()) // Nothing is asserted as nothing is returned, will throw error if something is wrong
    },
    PSS_TIMEOUT,
  )

  it(
    'should send and receive PSS message',
    async () => {
      return new Promise<void>((resolve, reject) => {
        ;(async () => {
          const topic = 'send-receive-pss-message'
          const message = 'hello'

          const ws = pss.subscribe(BEE_URL, topic)
          ws.onmessage = ev => {
            const receivedMessage = Buffer.from(ev.data as string).toString()

            // ignore empty messages
            if (receivedMessage.length === 0) {
              return
            }
            ws.terminate()
            expect(receivedMessage).toEqual(message)
            resolve()
          }

          const debugUrl = beeDebugUrl()

          const addresses = await connectivity.getNodeAddresses(debugUrl)
          const target = addresses.overlay
          await pss.send(BEE_PEER_URL, topic, target, message, getPostageBatch(BEE_DEBUG_PEER_URL))
        })().catch(reject)
      })
    },
    PSS_TIMEOUT,
  )

  it(
    'should send and receive PSS message with public key',
    async () => {
      // Jest does not allow use `done` and return Promise so this wrapper work arounds that.
      return new Promise<void>((resolve, reject) => {
        ;(async () => {
          const topic = 'send-receive-pss-public-key'
          const message = 'hello'

          const ws = pss.subscribe(BEE_URL, topic)
          ws.onmessage = ev => {
            const receivedMessage = Buffer.from(ev.data as string).toString()

            // ignore empty messages
            if (receivedMessage.length === 0) {
              return
            }
            ws.terminate()
            expect(receivedMessage).toEqual(message)
            resolve()
          }

          const debugUrl = beeDebugUrl()

          const addresses = await connectivity.getNodeAddresses(debugUrl)
          const target = addresses.overlay
          const recipient = addresses.pssPublicKey
          await pss.send(BEE_PEER_URL, topic, target, message, getPostageBatch(BEE_DEBUG_PEER_URL), recipient)
        })().catch(reject)
      })
    },
    PSS_TIMEOUT,
  )
})
