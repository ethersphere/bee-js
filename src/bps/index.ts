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
import WebSocket from '../utils/websocket.js'
import { BpsCloseCode } from '../types/index.js'
import type { BpsCloseEvent, BpsMessageHandler, BpsPublisher, BpsSubscription } from '../types/index.js'
import { BeeArgumentError, BeeError } from '../utils/error.js'

export interface BpsSocket {
  ws: WebSocket
  cancel: () => void
  isCancelled: () => boolean
}

interface Channel<S> {
  principal: EthAddress
  topic: Topic
  position: BpsPosition
  verify: boolean
  handler?: BpsMessageHandler<S>
}

const GRANTED = 'granted'

interface ChallengeMessage {
  challenge: string
  dataTopic: string
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

function assertValidRoster(principal: EthAddress, publishers: (EthAddress | Uint8Array | string)[]): void {
  const seen = new Set<string>()

  for (const publisher of publishers) {
    const address = new EthAddress(publisher)

    if (address.equals(principal)) {
      throw new BeeArgumentError('bps roster cannot name the principal', publisher)
    }

    if (seen.has(address.toHex())) {
      throw new BeeArgumentError('bps roster names an address twice', publisher)
    }
    seen.add(address.toHex())
  }
}

function toCloseEvent(event: WebSocket.CloseEvent): BpsCloseEvent {
  return { code: event.code, reason: event.reason, ended: event.code === BpsCloseCode.EndOfStream }
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
    principal: channel.principal,
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
  const owner = signer.publicKey().address()
  const isPrincipal = owner.equals(channel.principal)
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

  function assertPrincipal(action: string): void {
    if (!isPrincipal) {
      throw new BeeError(`only the principal can ${action}`)
    }
  }

  const publisher: BpsPublisher = {
    principal: channel.principal,
    topic: channel.topic,
    owner,
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
      assertPrincipal('set the roster')
      assertValidRoster(channel.principal, publishers)
      const index = nextRosterIndex
      sendChunk(BpsKind.Roster, index, encodeBpsRoster(publishers))
      nextRosterIndex = index + 1n

      return index
    },
    end() {
      assertPrincipal('end the channel')
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

      if (isPrincipal && options.roster) {
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

    function control(text: string): void {
      if (text === GRANTED) {
        if (!isPrincipal && !ready) {
          authenticate()
        }

        return
      }

      const message: ChallengeMessage = JSON.parse(text)
      challenge = new Bytes(message.challenge)

      if (!bpsSessionTopic(BpsKind.Data, channel.topic, challenge).equals(message.dataTopic)) {
        throw new BeeError('bps session topic mismatch between Bee and bee-js')
      }

      if (isPrincipal) {
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
        control(event.data)
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
