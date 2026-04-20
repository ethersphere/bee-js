import { Binary, Types } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import { makeContentAddressedChunk } from '../chunk/cac'
import { makeSOCAddress } from '../chunk/soc'
import type { BeeRequestOptions } from '../types'
import { GsocEphemeralParams, PubsubMode, PubsubTopicListResponse } from '../types'
import { Bytes } from '../utils/bytes'
import { http } from '../utils/http'
import { EthAddress, Identifier, PrivateKey, Signature } from '../utils/typed-bytes'
import { NULL_IDENTIFIER } from '../utils/constants'

const endpoint = 'pubsub'
const ENCODER = new TextEncoder()

const SIG_SIZE = Signature.LENGTH
const SPAN_WS_SIZE = 4

export interface IPubsubMode {
  readonly topicAddress: string
  getPublisherHeaders(): Record<string, string> | null
  encodeMessage(payload: Uint8Array | string): Promise<Uint8Array>
  decodeMessage(frame: Uint8Array): Bytes
}

export class GsocEphemeralMode implements IPubsubMode {
  readonly topicAddress: string
  private readonly socIdentifier: Identifier
  private readonly privateKey: PrivateKey | null
  private readonly externalAddressHex: string | null
  private readonly signFn: ((data: Uint8Array) => Signature | Promise<Signature>) | null

  constructor(params: GsocEphemeralParams) {
    if (params.socId !== undefined) {
      if (typeof params.socId === 'string') {
        this.socIdentifier = new Identifier(Binary.keccak256(ENCODER.encode(params.socId)))
      } else {
        this.socIdentifier = new Identifier(params.socId)
      }
    } else {
      this.socIdentifier = new Identifier(NULL_IDENTIFIER)
    }

    if ('address' in params && params.address && params.signFn) {
      // External signer path — can publish
      this.privateKey = null
      const signerAddress = new EthAddress(params.address)
      this.externalAddressHex = Binary.uint8ArrayToHex(signerAddress.toUint8Array())
      this.signFn = params.signFn
      this.topicAddress = makeSOCAddress(this.socIdentifier, signerAddress).toHex()
    } else if ('topic' in params && params.topic !== undefined) {
      // Ephemeral signer path — can publish
      if (typeof params.topic === 'string') {
        this.privateKey = new PrivateKey(Binary.keccak256(ENCODER.encode(params.topic)))
      } else {
        this.privateKey = new PrivateKey(params.topic)
      }
      const signerAddress = this.privateKey.publicKey().address()
      this.externalAddressHex = null
      this.signFn = null
      this.topicAddress = makeSOCAddress(this.socIdentifier, signerAddress).toHex()
    } else {
      // Subscriber-only path — read-only, topicAddress provided directly
      this.privateKey = null
      this.externalAddressHex = null
      this.signFn = null
      this.topicAddress = params.topicAddress
    }
  }

  getPublisherHeaders(): Record<string, string> | null {
    if (!this.privateKey && !this.externalAddressHex) {
      return null
    }

    const signerHex = this.privateKey
      ? Binary.uint8ArrayToHex(this.privateKey.publicKey().address().toUint8Array())
      : this.externalAddressHex!

    return {
      'swarm-pubsub-gsoc-eth-address': signerHex,
      'swarm-pubsub-gsoc-topic': this.socIdentifier.toHex(),
    }
  }

  async encodeMessage(payload: Uint8Array | string): Promise<Uint8Array> {
    const rawPayload = typeof payload === 'string' ? ENCODER.encode(payload) : payload
    const cac = makeContentAddressedChunk(rawPayload)

    let sigBytes: Uint8Array

    if (this.privateKey) {
      const soc = cac.toSingleOwnerChunk(this.socIdentifier, this.privateKey)
      sigBytes = soc.signature.toUint8Array()
    } else if (this.signFn) {
      const sigData = Binary.concatBytes(this.socIdentifier.toUint8Array(), cac.address.toUint8Array())
      const sig = await this.signFn(sigData)
      sigBytes = sig instanceof Signature ? sig.toUint8Array() : new Signature(sig).toUint8Array()
    } else {
      throw new Error('Cannot encode messages in subscriber-only mode (no signer available)')
    }

    const span4 = cac.span.toUint8Array().slice(0, SPAN_WS_SIZE)

    return Binary.concatBytes(sigBytes, span4, cac.payload.toUint8Array())
  }

  decodeMessage(frame: Uint8Array): Bytes {
    return new Bytes(frame.slice(SIG_SIZE + SPAN_WS_SIZE))
  }
}

export type PubsubModeParams = {
  [PubsubMode.GSOC_EPHEMERAL]: ConstructorParameters<typeof GsocEphemeralMode>
}

export type PubsubModeInstance = {
  [PubsubMode.GSOC_EPHEMERAL]: GsocEphemeralMode & IPubsubMode
}

export function createPubsubMode<M extends PubsubMode>(
  mode: M,
  ...params: PubsubModeParams[M]
): PubsubModeInstance[M] & IPubsubMode {
  switch (mode) {
    case PubsubMode.GSOC_EPHEMERAL: {
      const [modeParams] = params as PubsubModeParams[PubsubMode.GSOC_EPHEMERAL]

      return new GsocEphemeralMode(modeParams) as unknown as PubsubModeInstance[M] & IPubsubMode
    }
    default:
      throw new Error(`Unknown pubsub mode: ${mode}`)
  }
}

export function connect(
  url: string,
  topicAddress: string,
  brokerPeer: string,
  modeHeaders?: Record<string, string>,
  requestHeaders?: Record<string, string>,
): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')
  const headers: Record<string, string> = {
    ...requestHeaders,
    'swarm-pubsub-peer': brokerPeer,
    ...modeHeaders,
  }

  // Browsers cannot set custom headers on WebSocket connections.
  // Pass them as query params instead; the server accepts both.
  const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined'

  if (isBrowser) {
    const params = new URLSearchParams(headers)

    return new WebSocket(`${wsUrl}/${endpoint}/${topicAddress}?${params.toString()}`)
  }

  return new WebSocket(`${wsUrl}/${endpoint}/${topicAddress}`, { headers })
}

export async function listTopics(requestOptions: BeeRequestOptions): Promise<PubsubTopicListResponse> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${endpoint}/`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const topicsRaw = Types.asArray(body.topics, { name: 'topics' })

  return {
    topics: topicsRaw.map((item, i) => {
      const t = Types.asObject(item, { name: `topics[${i}]` })

      return {
        topicAddress: Types.asString(t.topicAddress, { name: 'topicAddress' }),
        mode: Types.asInteger(t.mode, { name: 'mode' }),
        role: Types.asString(t.role, { name: 'role' }) as 'broker' | 'subscriber',
        connections: Types.asArray(t.connections, { name: 'connections' }).map((c, j) =>
          Types.asString(c, { name: `connections[${j}]` }),
        ),
      }
    }),
  }
}
