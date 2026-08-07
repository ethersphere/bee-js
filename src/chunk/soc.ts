import {
  BatchId,
  Bytes,
  EthAddress,
  Identifier,
  PrivateKey,
  Reference,
  SingleOwnerChunk,
  Span,
  concatBytes,
  makeSOCAddress,
  makeSingleOwnerChunk as coreMakeSingleOwnerChunk,
  unmarshalSingleOwnerChunk as coreUnmarshalSingleOwnerChunk,
} from 'swarm-core'
import * as chunkAPI from '../api/chunk'
import * as socAPI from '../api/soc'
import { BeeRequestOptions, UploadOptions, UploadResult } from '../types'
import { BeeError } from '../utils/error'
import { Chunk, makeContentAddressedChunk } from './cac'

export { makeSOCAddress }
export type { SingleOwnerChunk }

/**
 * Unmarshals arbitrary data into a Single Owner Chunk.
 * Throws an error if the data is not a valid SOC.
 *
 * @param data    The chunk data
 * @param address The address of the single owner chunk
 *
 * @returns a single owner chunk or throws error
 */
export function unmarshalSingleOwnerChunk(
  data: Bytes | Uint8Array,
  address: Reference | Uint8Array | string,
): SingleOwnerChunk {
  try {
    return coreUnmarshalSingleOwnerChunk(data, address)
  } catch (e) {
    throw new BeeError((e as Error).message)
  }
}

/**
 * Creates a single owner chunk object
 *
 * @param chunk       A chunk object used for the span and payload
 * @param identifier  The identifier of the chunk
 * @param signer      The signer interface for signing the chunk
 */
export function makeSingleOwnerChunk(
  address: Reference,
  span: Span,
  payload: Bytes,
  identifier: Identifier | Uint8Array | string,
  signer: PrivateKey | Uint8Array | string,
): SingleOwnerChunk {
  identifier = new Identifier(identifier)
  signer = new PrivateKey(signer)
  const wrappedChunk = { data: concatBytes(span.toUint8Array(), payload.toUint8Array()), span, payload, address }

  return coreMakeSingleOwnerChunk(wrappedChunk, identifier, signer.toBigInt())
}

/**
 * Helper function to upload a chunk.
 *
 * It uses the Chunk API and calculates the address before uploading.
 *
 * @param requestOptions  Options for making requests
 * @param chunk           A chunk object
 * @param stamp  Postage BatchId that will be assigned to uploaded data
 * @param options         Upload options
 */
export async function uploadSingleOwnerChunk(
  requestOptions: BeeRequestOptions,
  chunk: SingleOwnerChunk,
  stamp: BatchId | Uint8Array | string,
  options?: UploadOptions,
): Promise<UploadResult> {
  const data = concatBytes(chunk.span.toUint8Array(), chunk.payload.toUint8Array())

  return socAPI.upload(requestOptions, chunk.owner, chunk.identifier, chunk.signature, data, stamp, options)
}

/**
 * Helper function to create and upload SOC.
 *
 * @param requestOptions  Options for making requests
 * @param signer          The signer interface for signing the chunk
 * @param postageBatchId
 * @param identifier      The identifier of the chunk
 * @param data            The chunk data
 * @param options
 */
export async function uploadSingleOwnerChunkData(
  requestOptions: BeeRequestOptions,
  signer: PrivateKey | Uint8Array | string,
  stamp: BatchId | Uint8Array | string,
  identifier: Identifier | Uint8Array | string,
  data: Uint8Array,
  options?: UploadOptions,
): Promise<UploadResult> {
  signer = new PrivateKey(signer)
  identifier = new Identifier(identifier)
  const cac = makeContentAddressedChunk(data)
  const soc = cac.toSingleOwnerChunk(identifier, signer)

  return uploadSingleOwnerChunk(requestOptions, soc, stamp, options)
}

export async function uploadSingleOwnerChunkWithWrappedChunk(
  requestOptions: BeeRequestOptions,
  signer: PrivateKey | Uint8Array | string,
  stamp: BatchId | Uint8Array | string,
  identifier: Identifier | Uint8Array | string,
  wrappedChunk: Chunk,
  options?: UploadOptions,
): Promise<UploadResult> {
  signer = new PrivateKey(signer)
  identifier = new Identifier(identifier)
  const soc = wrappedChunk.toSingleOwnerChunk(identifier, signer)

  return uploadSingleOwnerChunk(requestOptions, soc, stamp, options)
}

/**
 * Helper function to download SOC.
 *
 * @param url           The url of the Bee service
 * @param ownerAddress  The signer interface for signing the chunk
 * @param identifier    The identifier of the chunk
 */
export async function downloadSingleOwnerChunk(
  requestOptions: BeeRequestOptions,
  ownerAddress: EthAddress | Uint8Array | string,
  identifier: Identifier | Uint8Array | string,
): Promise<SingleOwnerChunk> {
  identifier = new Identifier(identifier)
  ownerAddress = new EthAddress(ownerAddress)
  const address = makeSOCAddress(identifier, ownerAddress)
  const cac = await chunkAPI.download(requestOptions, address.toHex())

  return unmarshalSingleOwnerChunk(cac, address)
}
