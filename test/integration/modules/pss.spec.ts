import * as connectivity from '../../../src/modules/debug/connectivity'
import * as pss from '../../../src/modules/pss'
import { beeKyOptions, beePeerKyOptions, beePeerUrl, beeUrl, getPostageBatch, makeTestTarget } from '../../utils'

const BEE_KY = beeKyOptions()
const BEE_URL = beeUrl()
const BEE_PEER_KY = beePeerKyOptions()
const BEE_PEER_URL = beePeerUrl()

// these tests only work when there is at least one peer connected
// TODO: Finish test
describe.skip('modules/pss', () => {
  it('should send PSS message', async function () {
    const topic = 'send-pss-message'
    const message = 'hello'

    const peers = await connectivity.getPeers(BEE_KY)
    expect(peers.length).toBeGreaterThan(0)

    const target = peers[0].address
    await pss.send(BEE_KY, topic, makeTestTarget(target), message, getPostageBatch()) // Nothing is asserted as nothing is returned, will throw error if something is wrong
  })

  it('should send and receive PSS message', async function () {
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
          expect(receivedMessage).toBe(message)
          resolve()
        }

        const addresses = await connectivity.getNodeAddresses(BEE_KY)
        const target = addresses.overlay
        await pss.send(BEE_PEER_KY, topic, makeTestTarget(target), message, getPostageBatch(BEE_PEER_URL))
      })().catch(reject)
    })
  })

  it('should send and receive PSS message with public key', async function () {
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
          expect(receivedMessage).toBe(message)
          resolve()
        }

        const addresses = await connectivity.getNodeAddresses(BEE_KY)
        const target = addresses.overlay
        const recipient = addresses.pssPublicKey
        await pss.send(BEE_PEER_KY, topic, makeTestTarget(target), message, getPostageBatch(BEE_PEER_URL), recipient)
      })().catch(reject)
    })
  })
})
