import { makeContentAddressedChunk } from "../chunk/cac";
import { keccak256Hash } from "../chunk/hash";
import { serializeBytes } from "../chunk/serialize";
import { Signer } from "../chunk/signer";
import { Identifier, makeSingleOwnerChunk } from "../chunk/soc";
import { uploadSingleOwnerChunk } from "../chunk/upload";
import { FindFeedUpdateResponse } from "../modules/feed";
import { ReferenceResponse, UploadOptions } from "../types";
import { Bytes, makeBytes } from "../utils/bytes";
import { writeUint64BigEndian } from "../utils/uint64";

export function makeSequentialFeedIdentifier(topic: Bytes<32>, index: number): Identifier {
  const indexBytes = writeUint64BigEndian(index)
  return keccak256Hash(topic, indexBytes)
}

type PlainChunkReference = Bytes<32>
type EncryptedChunkReference = Bytes<64>
export type ChunkReference = PlainChunkReference | EncryptedChunkReference

export async function uploadFeedUpdate(url: string, identifier: Identifier, signer: Signer, reference: ChunkReference, options?: UploadOptions): Promise<ReferenceResponse> {
  const timestamp = makeBytes(8)
  const payloadBytes = serializeBytes(timestamp, reference)
  const cac = makeContentAddressedChunk(payloadBytes)
  const soc = await makeSingleOwnerChunk(cac, identifier, signer)
  const response = await uploadSingleOwnerChunk(url, soc, options)

  return response
}
