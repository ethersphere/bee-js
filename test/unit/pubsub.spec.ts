import { Binary } from 'cafe-utility'
import { EthAddress, GsocEphemeralMode, NULL_IDENTIFIER, PrivateKey, PubsubMode, Signature, createPubsubMode } from '../../src'

const TOPIC = 'test-topic'
const PAYLOAD_TEXT = 'hello there!'
const PAYLOAD_BYTES = new TextEncoder().encode(PAYLOAD_TEXT)

const SIG_SIZE = 65
const SPAN_WS_SIZE = 8

test('GsocEphemeralMode - encodeMessage / decodeMessage round-trip (string payload)', async () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC })
  const frame = await mode.encodeMessage(PAYLOAD_TEXT)
  const decoded = mode.decodeMessage(frame)
  expect(decoded.toUtf8()).toBe(PAYLOAD_TEXT)
})

test('GsocEphemeralMode - encodeMessage / decodeMessage round-trip (Uint8Array payload)', async () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC })
  const frame = await mode.encodeMessage(PAYLOAD_BYTES)
  const decoded = mode.decodeMessage(frame)
  expect(decoded.toUint8Array()).toEqual(PAYLOAD_BYTES)
})

test('GsocEphemeralMode - frame structure: [sig:65B][span:8B][payload]', async () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC })
  const frame = await mode.encodeMessage(PAYLOAD_TEXT)

  expect(frame.length).toBe(SIG_SIZE + SPAN_WS_SIZE + PAYLOAD_BYTES.length)

  const spanView = new DataView(frame.buffer, frame.byteOffset + SIG_SIZE, SPAN_WS_SIZE)
  const span = spanView.getBigUint64(0, true)
  expect(span).toBe(BigInt(PAYLOAD_BYTES.length))
})

test('GsocEphemeralMode - deterministic headers for same topic', () => {
  const mode1 = new GsocEphemeralMode({ topic: TOPIC })
  const mode2 = new GsocEphemeralMode({ topic: TOPIC })
  const headers1 = mode1.getPublisherHeaders()!
  const headers2 = mode2.getPublisherHeaders()!

  expect(headers1['swarm-pubsub-gsoc-eth-address']).toBe(headers2['swarm-pubsub-gsoc-eth-address'])
  expect(headers1['swarm-pubsub-gsoc-topic']).toBe(headers2['swarm-pubsub-gsoc-topic'])
})

test('GsocEphemeralMode - default socId is NULL_IDENTIFIER', () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC })
  const headers = mode.getPublisherHeaders()!
  const nullIdHex = Binary.uint8ArrayToHex(NULL_IDENTIFIER)
  expect(headers['swarm-pubsub-gsoc-topic']).toBe(nullIdHex)
})

test('GsocEphemeralMode - custom socId as string (keccak256 hashed)', () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC, socId: 'my-id' })
  const headers = mode.getPublisherHeaders()!
  const nullIdHex = Binary.uint8ArrayToHex(NULL_IDENTIFIER)
  expect(headers['swarm-pubsub-gsoc-topic']).not.toBe(nullIdHex)
})

test('GsocEphemeralMode - custom socId as Uint8Array', () => {
  const customId = new Uint8Array(32).fill(0xab)
  const mode = new GsocEphemeralMode({ topic: TOPIC, socId: customId })
  const headers = mode.getPublisherHeaders()!
  expect(headers['swarm-pubsub-gsoc-topic']).toBe(Binary.uint8ArrayToHex(customId))
})

test('GsocEphemeralMode - different topics produce different headers', () => {
  const mode1 = new GsocEphemeralMode({ topic: 'topic-a' })
  const mode2 = new GsocEphemeralMode({ topic: 'topic-b' })

  expect(mode1.getPublisherHeaders()!['swarm-pubsub-gsoc-eth-address']).not.toBe(
    mode2.getPublisherHeaders()!['swarm-pubsub-gsoc-eth-address'],
  )
})

test('GsocEphemeralMode - external signer: mock signFn is called and frame is built', async () => {
  const privateKey = new PrivateKey(Binary.keccak256(new TextEncoder().encode('external-key')))
  const mockSig = privateKey.sign(new Uint8Array(32))

  const signFn = jest.fn().mockResolvedValue(mockSig)
  const address = privateKey.publicKey().address()

  const mode = new GsocEphemeralMode({ address, signFn })
  const frame = await mode.encodeMessage(PAYLOAD_TEXT)

  expect(signFn).toHaveBeenCalledTimes(1)
  expect(frame.length).toBe(SIG_SIZE + SPAN_WS_SIZE + PAYLOAD_BYTES.length)
  expect(frame.slice(0, SIG_SIZE)).toEqual(mockSig.toUint8Array())
})

test('GsocEphemeralMode - external signer: address header matches provided address', () => {
  const privateKey = new PrivateKey(Binary.keccak256(new TextEncoder().encode('external-key')))
  const address = privateKey.publicKey().address()
  const signFn = jest.fn()

  const mode = new GsocEphemeralMode({ address, signFn })
  const headers = mode.getPublisherHeaders()!

  expect(headers['swarm-pubsub-gsoc-eth-address']).toBe(Binary.uint8ArrayToHex(new EthAddress(address).toUint8Array()))
})

test('createPubsubMode factory - GSOC_EPHEMERAL creates GsocEphemeralMode', () => {
  const mode = createPubsubMode(PubsubMode.GSOC_EPHEMERAL, { topic: TOPIC })
  expect(mode).toBeInstanceOf(GsocEphemeralMode)
  expect(mode.topicAddress).toMatch(/^[0-9a-fA-F]{64}$/)
})

test('createPubsubMode factory - GSOC_EPHEMERAL with params', () => {
  const mode = createPubsubMode(PubsubMode.GSOC_EPHEMERAL, { topic: TOPIC, socId: 'my-id' })
  expect(mode).toBeInstanceOf(GsocEphemeralMode)
  const nullIdHex = Binary.uint8ArrayToHex(NULL_IDENTIFIER)
  expect(mode.getPublisherHeaders()!['swarm-pubsub-gsoc-topic']).not.toBe(nullIdHex)
})

test('GsocEphemeralMode - subscriber-only: topicAddress provided directly, no headers', () => {
  const topicAddr = 'ab'.repeat(32)
  const mode = new GsocEphemeralMode({ topicAddress: topicAddr })
  expect(mode.topicAddress).toBe(topicAddr)
  expect(mode.getPublisherHeaders()).toBeNull()
})

test('GsocEphemeralMode - subscriber-only: encodeMessage throws', async () => {
  const mode = new GsocEphemeralMode({ topicAddress: 'ab'.repeat(32) })
  await expect(mode.encodeMessage('hello')).rejects.toThrow('subscriber-only')
})

test('GsocEphemeralMode - ephemeral with Uint8Array topic (used as private key directly)', () => {
  const keyBytes = Binary.keccak256(new TextEncoder().encode('raw-key'))
  const mode = new GsocEphemeralMode({ topic: keyBytes })
  expect(mode.topicAddress).toMatch(/^[0-9a-fA-F]{64}$/)
  expect(mode.getPublisherHeaders()).not.toBeNull()
})

test('Signature - correctly validated on encoded message (ephemeral path)', async () => {
  const mode = new GsocEphemeralMode({ topic: TOPIC })
  const frame = await mode.encodeMessage(PAYLOAD_TEXT)
  const sigBytes = frame.slice(0, SIG_SIZE)
  expect(sigBytes.length).toBe(SIG_SIZE)
  const sig = new Signature(sigBytes)
  expect(sig).toBeInstanceOf(Signature)
})
