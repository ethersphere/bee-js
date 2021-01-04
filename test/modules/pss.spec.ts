import * as pss from '../../src/modules/pss'
import * as connectivity from '../../src/modules/debug/connectivity'
import { beeDebugUrl, beePeerUrl, beeUrl, okResponse, PSS_TIMEOUT } from '../utils'

const BEE_URL = beeUrl()
const BEE_PEER_URL = beePeerUrl()

// these tests only work when there is at least one peer connected
describe('modules/pss', () => {
  it(
    'should send PSS message',
    async () => {
      const topic = 'send-pss-message'
      const message = 'hello'

      const debugUrl = beeDebugUrl()
      const peers = await connectivity.getPeers(debugUrl)
      expect(peers.peers.length).toBeGreaterThan(0)

      const target = peers.peers[0].address
      const response = await pss.send(BEE_URL, topic, target, message)

      expect(response).toEqual(okResponse)
    },
    PSS_TIMEOUT,
  )

  it(
    'should send and receive PSS message',
    async done => {
      const topic = 'send-receive-pss-message'
      const message = 'hello'

      const ws = pss.subscribe(BEE_URL, topic)
      ws.onmessage = ev => {
        const receivedMessage = Buffer.from(ev.data).toString()

        // ignore empty messages
        if (receivedMessage.length === 0) {
          return
        }
        ws.terminate()
        expect(receivedMessage).toEqual(message)
        done()
      }

      const debugUrl = beeDebugUrl()

      const addresses = await connectivity.getNodeAddresses(debugUrl)
      const target = addresses.overlay
      await pss.send(BEE_PEER_URL, topic, target, message)
    },
    PSS_TIMEOUT,
  )

  it(
    'should send and receive PSS message with public key',
    async done => {
      const topic = 'send-receive-pss-public-key'
      const message = 'hello'

      const ws = pss.subscribe(BEE_URL, topic)
      ws.onmessage = ev => {
        const receivedMessage = Buffer.from(ev.data).toString()

        // ignore empty messages
        if (receivedMessage.length === 0) {
          return
        }
        ws.terminate()
        expect(receivedMessage).toEqual(message)
        done()
      }

      const debugUrl = beeDebugUrl()

      const addresses = await connectivity.getNodeAddresses(debugUrl)
      const target = addresses.overlay
      const recipient = addresses.pss_public_key
      await pss.send(BEE_PEER_URL, topic, target, message, recipient)
    },
    PSS_TIMEOUT,
  )
})
