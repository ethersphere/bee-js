import {
  BpsKind,
  BpsPosition,
  Bytes,
  EthAddress,
  PrivateKey,
  Topic,
  bpsSessionTopic,
  decodeBpsDeliveryFrame,
  encodeBpsPublishFrame,
  encodeBpsRoster,
  makeBpsChunk,
  verifyBpsChunk,
} from '@ethersphere/core-sdk'
import WebSocket from 'isomorphic-ws'
import type { BpsCloseEvent, BpsMessageHandler, BpsPublisher, BpsSubscription } from '../types'
import { BeeError } from '../utils/error'

const CLOSE_END_OF_STREAM = 4004

export interface BpsSocket {
  ws: WebSocket
  cancel: () => void
  isCancelled: () => boolean
}

interface Channel<S> {
  owner: EthAddress
  topic: Topic
  position: BpsPosition
  verify: boolean
  handler?: BpsMessageHandler<S>
}

interface ChallengeMessage {
  type: 'challenge'
  challenge: string
  dataTopic: string
}

interface GrantedMessage {
  type: 'granted'
}

function toBytes(data: unknown): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  throw new BeeError('unexpected bps websocket data')
}

function toCloseEvent(event: WebSocket.CloseEvent): BpsCloseEvent {
  return { code: event.code, reason: event.reason, ended: event.code === CLOSE_END_OF_STREAM }
}

function receive<S>(channel: Channel<S>, data: unknown, subscription: S): void {
  let delivery

  try {
    delivery = decodeBpsDeliveryFrame(toBytes(data))

    if (channel.verify) {
      verifyBpsChunk(delivery, channel.topic)
    }
  } catch (error) {
    channel.handler?.onError(new BeeError(`invalid bps delivery: ${(error as Error).message}`), subscription)

    return
  }

  if (!channel.position.accept(delivery)) {
    return
  }

  if (delivery.kind === BpsKind.Data) {
    channel.handler?.onMessage(
      { publisher: delivery.owner, index: delivery.index, payload: delivery.payload },
      subscription,
    )
  } else if (delivery.kind === BpsKind.Roster) {
    channel.handler?.onRoster?.(channel.position.roster, subscription)
  }
}

export function subscribe(
  socket: BpsSocket,
  channel: Channel<BpsSubscription> & { handler: BpsMessageHandler },
): BpsSubscription {
  const { ws } = socket
  const subscription: BpsSubscription = {
    owner: channel.owner,
    topic: channel.topic,
    position: channel.position,
    cancel: socket.cancel,
  }

  ws.binaryType = 'arraybuffer'
  ws.onmessage = event => {
    if (typeof event.data !== 'string') {
      receive(channel, event.data, subscription)
    }
  }
  ws.onerror = event => {
    if (!socket.isCancelled()) {
      channel.handler.onError(new BeeError(event.message), subscription)
    }
  }
  ws.onclose = event => {
    channel.handler.onClose(subscription, toCloseEvent(event))
  }

  return subscription
}

export async function publish(
  socket: BpsSocket,
  channel: Channel<BpsPublisher>,
  signer: PrivateKey,
  options: { index: bigint; rosterIndex: bigint; roster?: (EthAddress | Uint8Array | string)[]; heartbeat?: number },
  signal?: AbortSignal,
): Promise<BpsPublisher> {
  const { ws } = socket
  const identity = signer.publicKey().address()
  const isOwner = identity.equals(channel.owner)
  let challenge: Bytes | undefined
  let ready = false
  let nextIndex = options.index
  let nextRosterIndex = options.rosterIndex
  let heartbeat: ReturnType<typeof setInterval> | undefined

  function sendChunk(kind: BpsKind, index: bigint, payload?: string | Uint8Array | Bytes): void {
    if (!challenge || ws.readyState !== WebSocket.OPEN) {
      throw new BeeError('bps publisher is not connected')
    }

    const soc = makeBpsChunk(kind, channel.topic, challenge, index, signer, payload)
    ws.send(encodeBpsPublishFrame(kind, index, soc))
  }

  function assertOwner(action: string): void {
    if (!isOwner) {
      throw new BeeError(`only the owner can ${action}`)
    }
  }

  const publisher: BpsPublisher = {
    owner: channel.owner,
    topic: channel.topic,
    identity,
    position: channel.position,
    get challenge() {
      if (!challenge) {
        throw new BeeError('bps publisher has no challenge yet')
      }

      return challenge
    },
    get nextIndex() {
      return nextIndex
    },
    get nextRosterIndex() {
      return nextRosterIndex
    },
    send(data) {
      const index = nextIndex
      sendChunk(BpsKind.Data, index, data)
      nextIndex = index + 1n

      return index
    },
    setRoster(publishers) {
      assertOwner('set the roster')
      const index = nextRosterIndex
      sendChunk(BpsKind.Roster, index, encodeBpsRoster(publishers))
      nextRosterIndex = index + 1n

      return index
    },
    end() {
      assertOwner('end the channel')
      sendChunk(BpsKind.Eos, 0n)
    },
    cancel: socket.cancel,
  }

  return new Promise((resolve, reject) => {
    function fail(error: BeeError): void {
      if (!ready) {
        socket.cancel()
        reject(error)
      }
    }

    function authenticate(): void {
      sendChunk(BpsKind.Auth, 0n)

      if (isOwner && options.roster) {
        publisher.setRoster(options.roster)
      }

      if (options.heartbeat) {
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendChunk(BpsKind.Auth, 0n)
          }
        }, options.heartbeat)
      }

      ready = true
      resolve(publisher)
    }

    function control(message: ChallengeMessage | GrantedMessage): void {
      if (message.type === 'challenge') {
        challenge = new Bytes(message.challenge)

        if (!bpsSessionTopic(BpsKind.Data, channel.topic, challenge).equals(message.dataTopic)) {
          throw new BeeError('bps session topic mismatch between Bee and bee-js')
        }

        if (isOwner) {
          authenticate()
        }
      } else if (message.type === 'granted' && !isOwner && !ready) {
        authenticate()
      }
    }

    if (signal?.aborted) {
      fail(new BeeError('bps publish aborted'))

      return
    }
    signal?.addEventListener('abort', () => fail(new BeeError('bps publish aborted')), { once: true })

    ws.binaryType = 'arraybuffer'
    ws.onmessage = event => {
      if (typeof event.data !== 'string') {
        receive(channel, event.data, publisher)

        return
      }

      try {
        control(JSON.parse(event.data))
      } catch (error) {
        const beeError = error instanceof BeeError ? error : new BeeError(`invalid bps message: ${error}`)

        if (ready) {
          channel.handler?.onError(beeError, publisher)
        } else {
          fail(beeError)
        }
      }
    }
    ws.onerror = event => {
      if (socket.isCancelled()) {
        return
      }

      if (ready) {
        channel.handler?.onError(new BeeError(event.message), publisher)
      } else {
        fail(new BeeError(event.message))
      }
    }
    ws.onclose = event => {
      clearInterval(heartbeat)

      if (ready) {
        channel.handler?.onClose(publisher, toCloseEvent(event))
      } else {
        reject(new BeeError(`bps publish closed before authenticating: ${event.code} ${event.reason}`.trim()))
      }
    }
  })
}
