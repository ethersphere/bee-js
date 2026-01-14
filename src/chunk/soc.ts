import { Binary } from 'cafe-utility'
import * as chunkAPI from '../modules/chunk'
import * as socAPI from '../modules/soc'
import { BeeRequestOptions, UploadOptions, UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { BeeError } from '../utils/error'
import { BatchId, EthAddress, Identifier, PrivateKey, Reference, Signature, Span } from '../utils/typed-bytes'
import { calculateChunkAddress } from './bmt'
import { Chunk, makeContentAddressedChunk } from './cac'

const SOC_SIGNATURE_OFFSET = Identifier.LENGTH
const SOC_SPAN_OFFSET = SOC_SIGNATURE_OFFSET + Signature.LENGTH
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + Span.LENGTH

/**
 * Single Owner Chunk (SOC) is a chunk type where the address is determined by the owner and an arbitrary identifier.
 * Its integrity is attested by the owner's digital signature.
 *
 * Similar to Content Addressed Chunks (CAC), SOCs have a maximum payload size of 4096 bytes.
 *
 * - `span` indicates the size of the `payload` in bytes.
 * - `payload` contains the actual data or the body of the chunk.
 * - `data` contains the full chunk data - `span` and `payload`.
 * - `address` is the Swarm hash (or reference) of the chunk.
 * - `identifier` is an arbitrary identifier selected by the uploader.
 * - `signature` is the digital signature of the owner over the identifier and the underlying CAC address.
 * - `owner` is the Ethereum address of the chunk owner.
 */
export interface SingleOwnerChunk {
  /**
   * Contains the full chunk data - `span` + `payload`.
   */
  readonly data: Uint8Array
  /**
   * Indicates the size of the `payload` in bytes.
   */
  span: Span
  /**
   * Contains the actual data or the body of the chunk.
   */
  payload: Bytes
  /**
   * The Swarm hash (or reference) of the chunk.
   */
  address: Reference
  /**
   * An arbitrary identifier selected by the uploader.
   */
  identifier: Identifier
  /**
   * The digital signature of the owner over the identifier and the underlying CAC address.
   */
  signature: Signature
  /**
   * The Ethereum address of the chunk owner.
   */
  owner: EthAddress
}

function recoverChunkOwner(data: Uint8Array): EthAddress {
  const cacData = data.slice(SOC_SPAN_OFFSET)
  const chunkAddress = calculateChunkAddress(cacData)
  const signature = Signature.fromSlice(data, SOC_SIGNATURE_OFFSET)
  const identifier = Bytes.fromSlice(data, 0, Identifier.LENGTH)
  const digest = Binary.concatBytes(identifier.toUint8Array(), chunkAddress.toUint8Array())
  const ownerAddress = signature.recoverPublicKey(digest).address()

  return ownerAddress
}

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
  data = data instanceof Bytes ? data.toUint8Array() : data
  address = new Reference(address)
  const ownerAddress = recoverChunkOwner(data)
  const identifier = Bytes.fromSlice(data, 0, Identifier.LENGTH)
  const socAddress = new Reference(
    Binary.keccak256(Binary.concatBytes(identifier.toUint8Array(), ownerAddress.toUint8Array())),
  )

  if (!Binary.equals(address.toUint8Array(), socAddress.toUint8Array())) {
    throw new BeeError('SOC data does not match given address!')
  }

  const signature = Signature.fromSlice(data, SOC_SIGNATURE_OFFSET)
  const span = Span.fromSlice(data, SOC_SPAN_OFFSET)
  const payload = Bytes.fromSlice(data, SOC_PAYLOAD_OFFSET)

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address: socAddress,
    owner: ownerAddress,
  }
}

export function makeSOCAddress(identifier: Identifier, address: EthAddress): Reference {
  return new Reference(Binary.keccak256(Binary.concatBytes(identifier.toUint8Array(), address.toUint8Array())))
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
  const socAddress = makeSOCAddress(identifier, signer.publicKey().address())
  const signature = signer.sign(Binary.concatBytes(identifier.toUint8Array(), address.toUint8Array()))
  const data = Binary.concatBytes(identifier.toUint8Array(), signature.toUint8Array(), payload.toUint8Array())

  return {
    data,
    identifier,
    signature,
    span,
    payload,
    address: socAddress,
    owner: signer.publicKey().address(),
  }
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
  const data = Binary.concatBytes(chunk.span.toUint8Array(), chunk.payload.toUint8Array())

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
  const soc = makeSingleOwnerChunk(cac.address, cac.span, cac.payload, identifier, signer)

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
