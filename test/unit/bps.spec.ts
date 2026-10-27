import { AddressInfo } from 'node:net'
import {
  BpsKind,
  Bytes,
  PrivateKey,
  bpsSessionTopic,
  encodeBpsRoster,
  makeBpsChunk,
  numberToUint64,
  verifyBpsChunk,
} from '@ethersphere/core-sdk'
import { WebSocket, WebSocketServer } from 'ws'
import { Bee, BpsCloseEvent, BpsMessage, BpsPosition, BpsPublisher, BpsSubscription } from '../../src'

const TOPIC = '11'.repeat(32)
const BROKER = 'ab'.repeat(32)
const OWNER_KEY = new PrivateKey('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d')
const SEAT_KEY = new PrivateKey('6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1')
const OWNER = OWNER_KEY.publicKey().address()
const SEAT = SEAT_KEY.publicKey().address()
const PUBLISHER_CHALLENGE = new Bytes('33'.repeat(32))

let server: WebSocketServer
let bee: Bee
let onConnection: (socket: WebSocket, url: URL) => void

beforeAll(async () => {
  server = new WebSocketServer({ port: 0, host: '127.0.0.1' })
  server.on('connection', (socket, req) => onConnection(socket, new URL(req.url ?? '', 'http://localhost')))
  await new Promise<void>(resolve => server.on('listening', resolve))
  bee = new Bee(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, { signer: OWNER_KEY })
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

function delivery(kind: BpsKind, key: PrivateKey, index: bigint, payload?: Uint8Array | string): Buffer {
  const soc = makeBpsChunk(kind, TOPIC, PUBLISHER_CHALLENGE, index, key, payload)

  return Buffer.from(
    Bytes.concat(
      new Uint8Array([kind]),
      kind === BpsKind.Data ? key.publicKey().address() : OWNER,
      PUBLISHER_CHALLENGE,
      numberToUint64(index, 'BE'),
      soc.data,
    ),
  )
}

function challengeMessage(challenge: Bytes, dataTopic = bpsSessionTopic(BpsKind.Data, TOPIC, challenge)): string {
  return JSON.stringify({ type: 'challenge', challenge: challenge.toHex(), dataTopic: dataTopic.toHex() })
}

function parseFrame(data: Buffer) {
  return { kind: data[0] as BpsKind, index: data.readBigUInt64BE(1), soc: new Uint8Array(data.subarray(9)) }
}

async function collect(socket: WebSocket): Promise<ReturnType<typeof parseFrame>[]> {
  const frames: ReturnType<typeof parseFrame>[] = []
  socket.on('message', data => frames.push(parseFrame(data as Buffer)))

  return new Promise(resolve => socket.on('close', () => resolve(frames)))
}

describe('bpsSubscribe', () => {
  function subscribe(options: Partial<Parameters<Bee['messaging']['bpsSubscribe']>[3]> = {}) {
    const messages: BpsMessage[] = []
    const rosters: string[][] = []
    const errors: string[] = []
    let subscription!: BpsSubscription
    const closed = new Promise<BpsCloseEvent>(resolve => {
      subscription = bee.messaging.bpsSubscribe(
        OWNER,
        TOPIC,
        {
          onMessage: message => messages.push(message),
          onRoster: roster => rosters.push(roster.map(address => address.toHex())),
          onError: error => errors.push(error.message),
          onClose: (_, event) => resolve(event),
        },
        { broker: BROKER, ...options },
      )
    })

    return { messages, rosters, errors, closed, subscription }
  }

  test('sends the broker, identity and position, and delivers updates', async () => {
    let url!: URL
    onConnection = (socket, connectionUrl) => {
      url = connectionUrl
      socket.send(delivery(BpsKind.Data, OWNER_KEY, 5n, 'five'))
      socket.send(delivery(BpsKind.Data, OWNER_KEY, 4n, 'stale'))
      socket.send(delivery(BpsKind.Roster, OWNER_KEY, 0n, encodeBpsRoster([SEAT])))
      socket.send(delivery(BpsKind.Data, SEAT_KEY, 0n, 'seat'))
      socket.send(delivery(BpsKind.Eos, OWNER_KEY, 0n))
      socket.close(4004, 'end of stream')
    }

    const { messages, rosters, closed, subscription } = subscribe({
      identity: SEAT,
      position: new BpsPosition(OWNER, { cursor: 3n }),
    })
    const event = await closed

    expect(url.pathname).toBe(`/bps/subscribe/${OWNER.toHex()}/${TOPIC}`)
    expect(url.searchParams.get('broker')).toBe(BROKER)
    expect(url.searchParams.get('identity')).toBe(SEAT.toHex())
    expect(url.searchParams.get('cursor')).toBe('3')
    expect(url.searchParams.get('rosterCursor')).toBe('0')
    expect(messages.map(m => [m.publisher.toHex(), m.index, m.payload.toUtf8()])).toEqual([
      [OWNER.toHex(), 5n, 'five'],
      [SEAT.toHex(), 0n, 'seat'],
    ])
    expect(rosters).toEqual([[SEAT.toHex()]])
    expect(event).toEqual({ code: 4004, reason: 'end of stream', ended: true })
    expect(subscription.position.toQuery()).toEqual({ cursor: '6', rosterCursor: '1', roster: `${SEAT.toHex()}:1` })
    expect(subscription.position.ended).toBe(true)
  })

  test('resumes from a previous position', async () => {
    let url!: URL
    onConnection = (socket, connectionUrl) => {
      url = connectionUrl
      socket.close(4003, 'broker stream closed')
    }

    const position = new BpsPosition(OWNER, { cursor: 6n, rosterCursor: 1n, roster: { [SEAT.toHex()]: 2n } })
    const event = await subscribe({ position }).closed

    expect(event.ended).toBe(false)
    expect(url.searchParams.get('roster')).toBe(`${SEAT.toHex()}:2`)
    expect(url.searchParams.get('identity')).toHaveLength(40)
  })

  test('reports a tampered chunk when verifying', async () => {
    onConnection = socket => {
      const frame = delivery(BpsKind.Data, OWNER_KEY, 0n, 'hello')
      frame[frame.length - 1] ^= 1
      socket.send(frame)
      socket.close(4003)
    }

    const { messages, errors, closed } = subscribe({ verify: true })
    await closed

    expect(messages).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/invalid bps delivery/)
  })

  test('rejects the owner as identity and an ended position', () => {
    const handler = { onMessage: () => undefined, onError: () => undefined, onClose: () => undefined }

    expect(() => bee.messaging.bpsSubscribe(OWNER, TOPIC, handler, { broker: BROKER, identity: OWNER })).toThrow(
      /cannot be the owner/,
    )
    expect(() =>
      bee.messaging.bpsSubscribe(OWNER, TOPIC, handler, {
        broker: BROKER,
        position: new BpsPosition(OWNER, { ended: true }),
      }),
    ).toThrow(/ended/)
  })
})

describe('bpsPublish', () => {
  test('owner authenticates, republishes its roster and publishes', async () => {
    const challenge = new Bytes('44'.repeat(32))
    let url!: URL
    let frames!: Promise<ReturnType<typeof parseFrame>[]>
    onConnection = (socket, connectionUrl) => {
      url = connectionUrl
      frames = collect(socket)
      socket.send(challengeMessage(challenge))
    }

    const publisher = await bee.messaging.bpsPublish(OWNER, TOPIC, {
      broker: BROKER,
      index: 10n,
      rosterIndex: 2n,
      roster: [SEAT],
    })

    expect(publisher.send('hello')).toBe(10n)
    expect(publisher.send('world')).toBe(11n)
    expect(publisher.setRoster([])).toBe(3n)
    publisher.end()
    expect(publisher.nextIndex).toBe(12n)
    expect(publisher.challenge.toHex()).toBe(challenge.toHex())
    await new Promise(resolve => setTimeout(resolve, 50))
    publisher.cancel()
    const received = await frames

    expect(url.pathname).toBe(`/bps/publish/${OWNER.toHex()}/${TOPIC}`)
    expect(url.searchParams.get('identity')).toBe(OWNER.toHex())
    expect(received.map(frame => [frame.kind, frame.index])).toEqual([
      [BpsKind.Auth, 0n],
      [BpsKind.Roster, 2n],
      [BpsKind.Data, 10n],
      [BpsKind.Data, 11n],
      [BpsKind.Roster, 3n],
      [BpsKind.Eos, 0n],
    ])

    for (const frame of received) {
      expect(() => verifyBpsChunk({ ...frame, owner: OWNER, challenge }, TOPIC)).not.toThrow()
    }
    expect(verifyBpsChunk({ ...received[2], owner: OWNER, challenge }, TOPIC).payload.toUtf8()).toBe('hello')
  })

  test('seat waits for the grant before authenticating', async () => {
    const challenge = new Bytes('55'.repeat(32))
    let frames!: Promise<ReturnType<typeof parseFrame>[]>
    let grant!: () => void
    onConnection = socket => {
      frames = collect(socket)
      socket.send(challengeMessage(challenge))
      socket.send(delivery(BpsKind.Roster, OWNER_KEY, 0n, encodeBpsRoster([SEAT])))
      grant = () => socket.send(JSON.stringify({ type: 'granted' }))
    }

    const rosters: string[][] = []
    const pending = bee.messaging.bpsPublish(
      OWNER,
      TOPIC,
      { broker: BROKER, signer: SEAT_KEY },
      {
        onMessage: () => undefined,
        onRoster: roster => rosters.push(roster.map(address => address.toHex())),
        onError: () => undefined,
        onClose: () => undefined,
      },
    )
    await new Promise(resolve => setTimeout(resolve, 50))
    grant()
    const publisher = await pending

    expect(rosters).toEqual([[SEAT.toHex()]])
    expect(publisher.identity.toHex()).toBe(SEAT.toHex())
    publisher.send('from seat')
    expect(() => publisher.setRoster([])).toThrow(/only the owner/)
    expect(() => publisher.end()).toThrow(/only the owner/)
    await new Promise(resolve => setTimeout(resolve, 50))
    publisher.cancel()
    const received = await frames

    expect(received.map(frame => [frame.kind, frame.index])).toEqual([
      [BpsKind.Auth, 0n],
      [BpsKind.Data, 0n],
    ])
    expect(() => verifyBpsChunk({ ...received[1], owner: SEAT, challenge }, TOPIC)).not.toThrow()
  })

  test('rejects when the socket closes before authenticating', async () => {
    onConnection = socket => socket.close(4003, 'broker stream closed')

    await expect(bee.messaging.bpsPublish(OWNER, TOPIC, { broker: BROKER })).rejects.toThrow(
      /4003 broker stream closed/,
    )
  })

  test('rejects when Bee derives a different session topic', async () => {
    onConnection = socket => socket.send(challengeMessage(new Bytes('66'.repeat(32)), new Bytes('00'.repeat(32))))

    await expect(bee.messaging.bpsPublish(OWNER, TOPIC, { broker: BROKER })).rejects.toThrow(/session topic mismatch/)
  })

  test('rejects when aborted while waiting for the grant', async () => {
    onConnection = socket => socket.send(challengeMessage(new Bytes('77'.repeat(32))))
    const controller = new AbortController()
    const pending = bee.messaging.bpsPublish(OWNER, TOPIC, {
      broker: BROKER,
      signer: SEAT_KEY,
      signal: controller.signal,
    })
    setTimeout(() => controller.abort(), 50)

    await expect(pending).rejects.toThrow(/aborted/)
  })

  test('sends heartbeats', async () => {
    let frames!: Promise<ReturnType<typeof parseFrame>[]>
    onConnection = socket => {
      frames = collect(socket)
      socket.send(challengeMessage(new Bytes('88'.repeat(32))))
    }

    const publisher: BpsPublisher = await bee.messaging.bpsPublish(OWNER, TOPIC, { broker: BROKER, heartbeat: 20 })
    await new Promise(resolve => setTimeout(resolve, 110))
    publisher.cancel()
    const auths = (await frames).filter(frame => frame.kind === BpsKind.Auth)

    expect(auths.length).toBeGreaterThanOrEqual(3)
  })
})
