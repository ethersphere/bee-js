import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { recoverAddress, sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { makeSpan } from './span'
import { serializeBytes } from './serialize'
import { BeeError } from '../utils/error'
import { BrandedType } from '../types'

const MIN_PAYLOAD_SIZE = 1
const MAX_PAYLOAD_SIZE = 4096

const SPAN_SIZE = 8
const IDENTIFIER_SIZE = 32
const SIGNATURE_SIZE = 65

const CAC_SPAN_OFFSET = 0
const CAC_PAYLOAD_OFFSET = CAC_SPAN_OFFSET + SPAN_SIZE

const SOC_IDENTIFIER_OFFSET = 0
const SOC_SIGNATURE_OFFSET = SOC_IDENTIFIER_OFFSET + IDENTIFIER_SIZE
const SOC_SPAN_OFFSET = SOC_SIGNATURE_OFFSET + SIGNATURE_SIZE
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + SPAN_SIZE

type ChunkAddress = Bytes<32>

export interface Chunk {
  readonly data: Uint8Array
  span(): Bytes<8>
  payload(): FlexBytes<1, 4096>

  address(): ChunkAddress
}

type Identifier = Bytes<32>

export interface SingleOwnerChunk extends Chunk {
  identifier: () => Identifier
  signature: () => Signature
}

type ValidChunkData = BrandedType<Uint8Array, 'ValidChunkData'>
type ValidSingleOwnerChunkData = BrandedType<Uint8Array, 'ValidSingleOwnerChunkData'>

type SpanReference = Bytes<32> | Bytes<64>

export function makeContentAddressedChunk(payloadBytes: Uint8Array): Chunk {
  const span = makeSpan(payloadBytes.length)
  const payload = verifyFlexBytes(MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, payloadBytes)
  const data = serializeBytes(span, payload) as ValidChunkData
  const address = () => bmtHash(data)

  return makeChunk(data, address)
}

export function makeIntermediateChunk(spanLength: number, references: SpanReference[]): Chunk {
  if (spanLength < MAX_PAYLOAD_SIZE) {
    throw new BeeError('invalid spanLength (< 4096)')
  }
  const span = makeSpan(spanLength)
  const data = serializeBytes(span, ...references)
  const address = () => bmtHash(data)

  const minSize = SPAN_SIZE + MIN_PAYLOAD_SIZE
  const maxSize = SPAN_SIZE + MAX_PAYLOAD_SIZE
  verifyFlexBytes(minSize, maxSize, data)

  return makeChunk(data as ValidChunkData, address)
}

function makeChunk(data: ValidChunkData, address: () => ChunkAddress): Chunk {
  const span = () => bytesAtOffset(CAC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(CAC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)

  return {
    data,
    span,
    payload,
    address,
  }
}

export function isValidChunkData(data: Uint8Array, chunkAddress: ChunkAddress): data is ValidChunkData {
  const address = bmtHash(data)

  return bytesEqual(address, chunkAddress)
}

export function verifyChunk(data: Uint8Array, address: ChunkAddress): Chunk {
  if (isValidChunkData(data, address)) {
    return makeChunk(data, () => address)
  }
  throw new BeeError('verifyChunk')
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function isValidSingleOwnerChunkData(
  data: Uint8Array,
  address: ChunkAddress,
): data is ValidSingleOwnerChunkData {
  try {
    const cacData = data.slice(SOC_SPAN_OFFSET)
    const chunkAddress = bmtHash(cacData)
    const signature = verifyBytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
    const identifier = verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
    const digest = keccak256Hash(identifier, chunkAddress)
    const accountAddress = recoverAddress(signature, digest)
    const socAddress = keccak256Hash(identifier, accountAddress)

    return bytesEqual(address, socAddress)
  } catch (e) {
    return false
  }
}

export function verifySingleOwnerChunk(data: Uint8Array, address: ChunkAddress): SingleOwnerChunk {
  if (isValidSingleOwnerChunkData(data, address)) {
    return makeSingleOwnerChunkFromData(data, () => address)
  }
  throw new BeeError('verifySingleOwnerChunk')
}

function verifyBytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return verifyBytes(length, bytesAtOffset(offset, length, data))
}

function bytesAtOffset<Length extends number>(offset: number, length: Length, data: Uint8Array): Bytes<Length> {
  return data.slice(offset, offset + length) as Bytes<Length>
}

function flexBytesAtOffset<Min extends number, Max extends number>(
  offset: number,
  _min: Min,
  _max: Max,
  data: Uint8Array,
): FlexBytes<Min, Max> {
  return data.slice(offset) as FlexBytes<Min, Max>
}

function makeSingleOwnerChunkFromData(data: ValidSingleOwnerChunkData, address: () => ChunkAddress): SingleOwnerChunk {
  const identifier = () => bytesAtOffset(SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE, data)
  const signature = () => bytesAtOffset(SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE, data)
  const span = () => bytesAtOffset(SOC_SPAN_OFFSET, SPAN_SIZE, data)
  const payload = () => flexBytesAtOffset(SOC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE, data)

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address,
  }
}

export async function makeSingleOwnerChunk(
  chunk: Chunk,
  identifier: Identifier,
  signer: Signer,
): Promise<SingleOwnerChunk> {
  const chunkAddress = chunk.address()
  verifyChunk(chunk.data, chunkAddress)

  const digest = keccak256Hash(identifier, chunkAddress)
  const signature = await sign(digest, signer)
  const data = serializeBytes(identifier, signature, chunk.data) as ValidSingleOwnerChunkData
  const address = () => keccak256Hash(identifier, signer.address)

  return makeSingleOwnerChunkFromData(data, address)
}
