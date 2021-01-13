import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { makeSpan } from './span'

export interface Chunk {
  readonly span: Bytes<8>
  readonly payload: FlexBytes<1, 4096>

  address(): Bytes<32>
  serialize(): Uint8Array
}

type Identifier = Bytes<32>

export interface SingleOwnerChunk extends Chunk {
  identifier: Identifier
  signature: Signature
}

export function makeContentAddressedChunk(payloadBytes: Uint8Array): Chunk {
  const span = makeSpan(payloadBytes.length)
  return makeChunk(span, payloadBytes)
}


export function serializeBytes(...arrays: Uint8Array[]): Uint8Array {
  const length = arrays.reduce((prev, curr) => prev + curr.length, 0)
  const buffer = new Uint8Array(length)
  let offset = 0
  arrays.forEach(arr => {
    buffer.set(arr, offset)
    offset += arr.length
  })
  return buffer
}

type SpanReference = Bytes<32> | Bytes<64>
export function makeIntermediateChunk(spanBytes: Uint8Array, references: SpanReference[]) {
  return makeChunk(spanBytes, serializeBytes(...references))
}

export function makeChunk(spanBytes: Uint8Array, payloadBytes: Uint8Array): Chunk {
  const span = verifyBytes(spanBytes, 8)
  const payload = verifyFlexBytes(payloadBytes, 1, 4096)
  const serialize = () => serializeBytes(span, payload)
  const address = () => bmtHash(serialize())

  return {
    span,
    payload,
    address,
    serialize,
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
  const address = () => keccak256Hash(identifier, signer.address)
  const serialize = () => new Uint8Array([...identifier, ...signature, ...chunk.span, ...chunk.payload])

  return {
    ...chunk,
    identifier,
    signature,
    address,
    serialize,
  }
}
