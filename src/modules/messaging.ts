import { Binary, System } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import { makeContentAddressedChunk } from '../chunk/cac'
import { makeSOCAddress, uploadSingleOwnerChunk } from '../chunk/soc'
import type {
  BeeRequestOptions,
  GsocMessageHandler,
  GsocSubscription,
  PssMessageHandler,
  PssSubscription,
  UploadOptions,
} from '../types'
import { Bytes } from '../utils/bytes'
import { prepareWebsocketData } from '../utils/data'
import { BeeError } from '../utils/error'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { GsocMessageHandlerSchema, PssMessageHandlerSchema } from '../utils/schema'
import { assertData } from '../utils/type'
import { BatchId, EthAddress, Identifier, PeerAddress, PrivateKey, PublicKey, Topic } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const PSS_ENDPOINT = 'pss'
const GSOC_ENDPOINT = 'gsoc'

/**
 * Messaging protocols — PSS (Postal Service for Swarm) and GSOC. Method names keep
 * their `pss`/`gsoc` prefixes to distinguish the two protocols within the namespace.
 *
 * Accessed as `bee.messaging`.
 */
export class Messaging {
  constructor(private readonly context: BeeContext) {}

  /**
   * Sends data to a recipient or target with the Postal Service for Swarm.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param postageBatchId Postage BatchId that will be assigned to the sent message.
   * @param topic Topic name
   * @param target Target message address prefix
   * @param data Message to send
   * @param recipient Optional recipient public key
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async pssSend(
    postageBatchId: BatchId | Uint8Array | string,
    topic: Topic,
    target: string,
    data: string | Uint8Array,
    recipient?: string | PublicKey,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    const batchId = new BatchId(postageBatchId)
    assertData(data)

    const recipientKey = recipient ? new PublicKey(recipient) : undefined

    await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: `${PSS_ENDPOINT}/send/${topic}/${target}`,
      data,
      responseType: 'json',
      params: { recipient: recipientKey },
      headers: prepareRequestHeaders(batchId),
    })
  }

  /**
   * Subscribes to messages for the given topic with the Postal Service for Swarm.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param topic Topic name
   * @param handler Message handler interface
   */
  pssSubscribe(topic: Topic, handler: PssMessageHandler): PssSubscription {
    handler = PssMessageHandlerSchema.parse(handler)

    const ws = this.openWebSocket(`${PSS_ENDPOINT}/subscribe/${topic.toHex()}`)
    const cancel = this.makeCancel(ws)
    const subscription: PssSubscription = { topic, cancel }

    ws.onmessage = async event => {
      const data = await prepareWebsocketData(event.data)

      if (data.length) {
        handler.onMessage(new Bytes(data), subscription)
      }
    }
    ws.onerror = event => {
      if (!this.isCancelled(ws)) {
        handler.onError(new BeeError(event.message), subscription)
      }
    }
    ws.onclose = () => {
      handler.onClose(subscription)
    }

    return subscription
  }

  /**
   * Receives a single message using the Postal Service for Swarm.
   *
   * **Warning! Only full nodes can accept PSS messages.**
   *
   * @param topic Topic name
   * @param timeoutMsec Timeout in milliseconds
   */
  async pssReceive(topic: Topic, timeoutMsec = 0): Promise<Bytes> {
    if (typeof timeoutMsec !== 'number') {
      throw new TypeError('timeoutMsc parameter has to be a number!')
    }

    return new Promise((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      const subscription = this.pssSubscribe(topic, {
        onError: error => {
          clearTimeout(timeout)
          subscription.cancel()
          reject(error.message)
        },
        onMessage: message => {
          clearTimeout(timeout)
          subscription.cancel()
          resolve(message)
        },
        onClose: () => {
          clearTimeout(timeout)
          subscription.cancel()
        },
      })

      if (timeoutMsec > 0) {
        timeout = setTimeout(() => {
          subscription.cancel()
          reject(new BeeError('pssReceive timeout'))
        }, timeoutMsec)
      }
    })
  }

  /**
   * Mines the signer (a private key) to be used to send GSOC messages to the specific target overlay address.
   *
   * @param targetOverlay
   * @param identifier
   * @param proximity
   */
  gsocMine(
    targetOverlay: PeerAddress | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    proximity = 12,
  ): PrivateKey {
    const overlay = new PeerAddress(targetOverlay)
    const id = new Identifier(identifier)
    const start = 0xb33n

    for (let i = 0n; i < 0xffffn; i++) {
      const signer = new PrivateKey(Binary.numberToUint256(start + i, 'BE'))
      const socAddress = makeSOCAddress(id, signer.publicKey().address())
      // TODO: test the significance of the hardcoded 256
      const actualProximity = 256 - Binary.proximity(socAddress.toUint8Array(), overlay.toUint8Array())

      if (actualProximity <= 256 - proximity) {
        return signer
      }
    }

    throw Error('Could not mine a valid signer')
  }

  /**
   * Sends a GSOC message with the specified signer and identifier.
   *
   * **Warning! Only full nodes can accept GSOC messages.**
   *
   * @param postageBatchId
   * @param signer
   * @param identifier
   * @param data
   * @param options
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async gsocSend(
    postageBatchId: BatchId | Uint8Array | string,
    signer: PrivateKey | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    data: string | Uint8Array,
    options?: UploadOptions,
    requestOptions?: BeeRequestOptions,
  ) {
    const batchId = new BatchId(postageBatchId)
    const key = new PrivateKey(signer)
    const id = new Identifier(identifier)

    const cac = makeContentAddressedChunk(data)
    const soc = cac.toSingleOwnerChunk(id, key)

    return uploadSingleOwnerChunk(this.context.getRequestOptionsForCall(requestOptions), soc, batchId, options)
  }

  /**
   * Subscribes to GSOC messages for the specified owner (of the signer) and identifier.
   *
   * **Warning! Only full nodes can accept GSOC messages.**
   *
   * @param address
   * @param identifier
   * @param handler
   */
  gsocSubscribe(
    address: EthAddress | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    handler: GsocMessageHandler,
  ): GsocSubscription {
    const ethAddress = new EthAddress(address)
    const id = new Identifier(identifier)
    handler = GsocMessageHandlerSchema.parse(handler)

    const socAddress = makeSOCAddress(id, ethAddress)
    const ws = this.openWebSocket(`${GSOC_ENDPOINT}/subscribe/${socAddress.toHex()}`)
    const cancel = this.makeCancel(ws)
    const subscription: GsocSubscription = { address: ethAddress, cancel }

    ws.onmessage = async event => {
      const data = await prepareWebsocketData(event.data)

      if (data.length) {
        handler.onMessage(new Bytes(data), subscription)
      }
    }
    ws.onerror = event => {
      if (!this.isCancelled(ws)) {
        handler.onError(new BeeError(event.message), subscription)
      }
    }
    ws.onclose = () => {
      handler.onClose(subscription)
    }

    return subscription
  }

  private openWebSocket(path: string): WebSocket {
    const wsUrl = this.context.url.replace(/^http/i, 'ws')

    if (System.whereAmI() === 'browser') {
      return new WebSocket(`${wsUrl}/${path}`)
    }

    return new WebSocket(`${wsUrl}/${path}`, {
      headers: this.context.getRequestOptionsForCall().headers,
    })
  }

  private readonly cancelled = new WeakSet<WebSocket>()

  private makeCancel(ws: WebSocket): () => void {
    return () => {
      if (!this.cancelled.has(ws)) {
        this.cancelled.add(ws)

        if (ws.terminate) {
          ws.terminate()
        } else {
          ws.close()
        }
      }
    }
  }

  private isCancelled(ws: WebSocket): boolean {
    return this.cancelled.has(ws)
  }
}
