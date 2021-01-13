import { Bytes, FlexBytes, verifyBytes, verifyFlexBytes } from './bytes'
import { bmtHash } from './bmt'
import { sign, Signature, Signer } from './signer'
import { keccak256Hash } from './hash'

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

export function makeContentAddressedChunk(spanBytes: Uint8Array, payloadBytes: Uint8Array): Chunk {
  const span = verifyBytes(spanBytes, 8)
  const payload = verifyFlexBytes(payloadBytes, 1, 4096)
  const address = () => bmtHash(new Uint8Array([...span, ...payload])) as Bytes<32>
  const serialize = () => new Uint8Array([...span, ...payload])

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
