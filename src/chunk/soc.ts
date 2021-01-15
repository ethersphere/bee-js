import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { recoverAddress, sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { makeSpan } from './span'
import { serializeBytes } from './serialize'
import { BeeError } from '../utils/error'
import { BrandedType } from '../types'

const SOC_IDENTIFIER_OFFSET = 0
const SOC_IDENTIFIER_SIZE = 32
const SOC_SIGNATURE_OFFSET = SOC_IDENTIFIER_OFFSET + SOC_IDENTIFIER_SIZE
const SOC_SIGNATURE_SIZE = 65
const SOC_SPAN_OFFSET = SOC_SIGNATURE_SIZE + SOC_SIGNATURE_OFFSET
const SOC_SPAN_SIZE = 8
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + SOC_SPAN_SIZE

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
  const payload = verifyFlexBytes(1, 4096, payloadBytes)
  const data = serializeBytes(span, payload) as ValidChunkData
  const address = () => bmtHash(data)

  return makeChunk(data, address)
}

export function makeIntermediateChunk(spanLength: number, references: SpanReference[]): Chunk {
  if (spanLength < 4096) {
    throw new BeeError('invalid spanLength (< 4096)')
  }
  const span = makeSpan(spanLength)
  const data = serializeBytes(span, ...references) as ValidChunkData
  const address = () => bmtHash(data)

  return makeChunk(data, address)
}

function makeChunk(data: ValidChunkData, address: () => ChunkAddress): Chunk {
  const span = () => data.slice(0, 8) as Bytes<8>
  const payload = () => data.slice(8) as FlexBytes<1, 4096>

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
    const cacData = data.slice(SOC_SPAN_OFFSET) as ValidChunkData
    const chunkAddress = bmtHash(cacData)
    const signature = verifyBytesAtOffset(SOC_SIGNATURE_OFFSET, SOC_SIGNATURE_SIZE, data)
    const identifier = verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, SOC_IDENTIFIER_SIZE, data)
    const accountAddress = recoverAddress(signature, chunkAddress)
    const socAddress = keccak256Hash(identifier, accountAddress)

    return bytesEqual(address, socAddress)
  } catch (e) {
    console.debug({e})
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
  return verifyBytes(length, data.slice(offset, offset + length))
}

function verifyFlexBytesAtOffset<Min extends number, Max extends number>(
  offset: number,
  min: Min,
  max: Max,
  data: Uint8Array,
): FlexBytes<Min, Max> {
  return verifyFlexBytes(min, max, data.slice(offset))
}

function makeSingleOwnerChunkFromData(data: ValidSingleOwnerChunkData, address: () => ChunkAddress): SingleOwnerChunk {
  const identifier = () => verifyBytesAtOffset(SOC_IDENTIFIER_OFFSET, SOC_IDENTIFIER_SIZE, data)
  const signature = () => verifyBytesAtOffset(SOC_SIGNATURE_OFFSET, SOC_SIGNATURE_SIZE, data)
  const span = () => verifyBytesAtOffset(SOC_SPAN_OFFSET, SOC_SPAN_SIZE, data)
  const payload = () => verifyFlexBytesAtOffset(SOC_PAYLOAD_OFFSET, 1, 4096, data)

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
  const digest = keccak256Hash(identifier, chunkAddress)
  const signature = await sign(digest, signer)
  const data = serializeBytes(identifier, signature, chunk.data) as ValidSingleOwnerChunkData
  const address = () => keccak256Hash(identifier, signer.address)

  return makeSingleOwnerChunkFromData(data, address)
}
