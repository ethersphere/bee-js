import { Binary, System } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import {
  BatchId,
  BpsPosition,
  Bytes,
  EthAddress,
  Identifier,
  makeContentAddressedChunk,
  numberToUint256,
  PeerAddress,
  PrivateKey,
  PublicKey,
  Topic,
} from '@ethersphere/core-sdk'
import * as pssApi from '../api/pss'
import * as bps from '../bps'
import type { BpsSocket } from '../bps'
import { makeSOCAddress, uploadSingleOwnerChunk } from '../chunk/soc'
import type {
  BeeRequestOptions,
  BpsMessageHandler,
  BpsPublisher,
  BpsPublishOptions,
  BpsSubscribeOptions,
  BpsSubscription,
  ChunkUploadOptions,
  GsocMessageHandler,
  GsocSubscribeOptions,
  GsocSubscription,
  PssMessageHandler,
  PssSubscription,
} from '../types'
import { prepareWebsocketData } from '../utils/data'
import { BeeArgumentError, BeeError } from '../utils/error'
import {
  BpsMessageHandlerSchema,
  GsocMessageHandlerSchema,
  GsocSubscribeOptionsSchema,
  PssMessageHandlerSchema,
} from '../utils/schema'
import { assertData } from '../utils/type'
import type { BeeContext } from './context'

const PSS_ENDPOINT = 'pss'
const GSOC_ENDPOINT = 'gsoc'
const BPS_ENDPOINT = 'bps'

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

    await pssApi.send(this.context.getRequestOptionsForCall(requestOptions), batchId, topic, target, data, recipientKey)
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
      const signer = new PrivateKey(numberToUint256(start + i, 'BE'))
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
    options?: ChunkUploadOptions,
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
   * @param options SOC fields to receive and whether to cache the wrapped chunk; requires Bee 2.8.3 or later
   */
  gsocSubscribe(
    address: EthAddress | Uint8Array | string,
    identifier: Identifier | Uint8Array | string,
    handler: GsocMessageHandler,
    options?: GsocSubscribeOptions,
  ): GsocSubscription {
    const ethAddress = new EthAddress(address)
    const id = new Identifier(identifier)
    handler = GsocMessageHandlerSchema.parse(handler)
    const { fields, cacheWrappedChunk } = GsocSubscribeOptionsSchema.parse(options ?? {})

    const params = new URLSearchParams()

    if (fields) {
      params.set('swarm-soc-fields', fields.join(','))
    }

    if (cacheWrappedChunk !== undefined) {
      params.set('swarm-cache-wrapped-chunk', String(cacheWrappedChunk))
    }

    const socAddress = makeSOCAddress(id, ethAddress)
    const query = params.toString() ? `?${params.toString()}` : ''
    const ws = this.openWebSocket(`${GSOC_ENDPOINT}/subscribe/${socAddress.toHex()}${query}`)
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

  /** Subscribes to a BPS live channel; pass a previous subscription's `position` to resume without duplicates. */
  bpsSubscribe(
    owner: EthAddress | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    handler: BpsMessageHandler,
    options: BpsSubscribeOptions,
  ): BpsSubscription {
    const ownerAddress = new EthAddress(owner)
    const bpsTopic = new Topic(topic)
    handler = BpsMessageHandlerSchema.parse(handler)
    const identity = new EthAddress(options.identity ?? globalThis.crypto.getRandomValues(new Uint8Array(20)))

    if (identity.equals(ownerAddress)) {
      throw new BeeArgumentError('bps subscriber identity cannot be the owner, use bpsPublish', options.identity)
    }

    const position = options.position ?? new BpsPosition(ownerAddress)

    if (position.ended) {
      throw new BeeError('bps channel has ended')
    }

    const params = new URLSearchParams({
      broker: new PeerAddress(options.broker).toHex(),
      identity: identity.toHex(),
      ...position.toQuery(),
    })
    const socket = this.openBpsSocket('subscribe', ownerAddress, bpsTopic, params)

    return bps.subscribe(socket, {
      owner: ownerAddress,
      topic: bpsTopic,
      position,
      verify: options.verify ?? false,
      handler,
    })
  }

  /** Opens a BPS publisher stream as the signer (the owner or a rostered seat); resolves once authenticated. */
  async bpsPublish(
    owner: EthAddress | Uint8Array | string,
    topic: Topic | Uint8Array | string,
    options: BpsPublishOptions,
    handler?: BpsMessageHandler<BpsPublisher>,
  ): Promise<BpsPublisher> {
    const ownerAddress = new EthAddress(owner)
    const bpsTopic = new Topic(topic)
    const signer = options.signer ? new PrivateKey(options.signer) : this.context.signer

    if (!signer) {
      throw new BeeArgumentError('bpsPublish requires a signer', options.signer)
    }

    if (handler) {
      handler = BpsMessageHandlerSchema.parse(handler)
    }

    const params = new URLSearchParams({
      broker: new PeerAddress(options.broker).toHex(),
      identity: signer.publicKey().address().toHex(),
    })
    const socket = this.openBpsSocket('publish', ownerAddress, bpsTopic, params)

    return bps.publish(
      socket,
      {
        owner: ownerAddress,
        topic: bpsTopic,
        position: options.position ?? new BpsPosition(ownerAddress),
        verify: options.verify ?? false,
        handler,
      },
      signer,
      {
        index: options.index ?? 0n,
        rosterIndex: options.rosterIndex ?? 0n,
        roster: options.roster,
        heartbeat: options.heartbeat,
      },
      options.signal,
    )
  }

  private openBpsSocket(
    mode: 'subscribe' | 'publish',
    owner: EthAddress,
    topic: Topic,
    params: URLSearchParams,
  ): BpsSocket {
    const ws = this.openWebSocket(`${BPS_ENDPOINT}/${mode}/${owner.toHex()}/${topic.toHex()}?${params.toString()}`)

    return { ws, cancel: this.makeCancel(ws), isCancelled: () => this.isCancelled(ws) }
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
