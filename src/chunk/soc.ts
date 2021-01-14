import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'
import { makeSpan } from './span'
import { serializeBytes } from './serialize'

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

type SpanReference = Bytes<32> | Bytes<64>

export function makeIntermediateChunk(spanBytes: Uint8Array, references: SpanReference[]): Chunk {
  return makeChunk(spanBytes, serializeBytes(...references))
}

export function makeChunk(spanBytes: Uint8Array, payloadBytes: Uint8Array): Chunk {
  const span = verifyBytes(8, spanBytes)
  const payload = verifyFlexBytes(1, 4096, payloadBytes)
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
