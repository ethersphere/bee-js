import { Binary } from 'cafe-utility'
import * as chunkAPI from '../modules/chunk'
import * as socAPI from '../modules/soc'
import {
  BatchId,
  BeeRequestOptions,
  PlainBytesReference,
  Signature,
  Signer,
  UploadOptions,
  UploadResult,
} from '../types'
import { Bytes, bytesAtOffset, bytesEqual, flexBytesAtOffset } from '../utils/bytes'
import { BeeError } from '../utils/error'
import { EthAddress } from '../utils/eth'
import { keccak256Hash } from '../utils/hash'
import { bytesToHex } from '../utils/hex'
import { bmtHash } from './bmt'
import { Chunk, MAX_PAYLOAD_SIZE, MIN_PAYLOAD_SIZE, assertValidChunkData, makeContentAddressedChunk } from './cac'
import { recoverAddress, sign } from './signer'
import { SPAN_SIZE } from './span'

const IDENTIFIER_SIZE = 32
const SIGNATURE_SIZE = 65

const SOC_IDENTIFIER_OFFSET = 0
const SOC_SIGNATURE_OFFSET = SOC_IDENTIFIER_OFFSET + IDENTIFIER_SIZE
const SOC_SPAN_OFFSET = SOC_SIGNATURE_OFFSET + SIGNATURE_SIZE
const SOC_PAYLOAD_OFFSET = SOC_SPAN_OFFSET + SPAN_SIZE

export type Identifier = Bytes<32>

/**
 * With single owner chunks, a user can assign arbitrary data to an
 * address and attest chunk integrity with their digital signature.
 *
 * This interface extends the Chunk interface so it has the same
 * properties, but the address calculation is based on the identifier
 * and the owner of the chunk.
 */
export interface SingleOwnerChunk extends Chunk {
  identifier: () => Identifier
  signature: () => Signature
  owner: () => EthAddress
}

function recoverChunkOwner(data: Uint8Array): EthAddress {
  const cacData = data.slice(SOC_SPAN_OFFSET)
  const chunkAddress = bmtHash(cacData)
  const signature = bytesAtOffset(data, SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE)
  const identifier = bytesAtOffset(data, SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE)
  const digest = keccak256Hash(identifier, chunkAddress)
  const ownerAddress = recoverAddress(signature, digest)

  return ownerAddress
}

/**
 * Verifies if the data is a valid single owner chunk
 *
 * @param data    The chunk data
 * @param address The address of the single owner chunk
 *
 * @returns a single owner chunk or throws error
 */
export function makeSingleOwnerChunkFromData(data: Uint8Array, address: PlainBytesReference): SingleOwnerChunk {
  const ownerAddress = recoverChunkOwner(data)
  const identifier = bytesAtOffset(data, SOC_IDENTIFIER_OFFSET, IDENTIFIER_SIZE)
  const socAddress = keccak256Hash(identifier, ownerAddress)

  if (!bytesEqual(address, socAddress)) {
    throw new BeeError('SOC Data does not match given address!')
  }

  const signature = () => bytesAtOffset(data, SOC_SIGNATURE_OFFSET, SIGNATURE_SIZE)
  const span = () => bytesAtOffset(data, SOC_SPAN_OFFSET, SPAN_SIZE)
  const payload = () => flexBytesAtOffset(data, SOC_PAYLOAD_OFFSET, MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE)

  return {
    data,
    identifier: () => identifier,
    signature,
    span,
    payload,
    address: () => socAddress,
    owner: () => ownerAddress,
  }
}

export function makeSOCAddress(identifier: Identifier, address: EthAddress): PlainBytesReference {
  return keccak256Hash(identifier, address)
}

/**
 * Creates a single owner chunk object
 *
 * @param chunk       A chunk object used for the span and payload
 * @param identifier  The identifier of the chunk
 * @param signer      The singer interface for signing the chunk
 */
export async function makeSingleOwnerChunk(
  chunk: Chunk,
  identifier: Identifier,
  signer: Signer,
): Promise<SingleOwnerChunk> {
  const chunkAddress = chunk.address()
  assertValidChunkData(chunk.data, chunkAddress)

  const digest = keccak256Hash(identifier, chunkAddress)
  const signature = await sign(signer, digest)
  const data = Binary.concatBytes(identifier, signature, chunk.span(), chunk.payload())
  const address = makeSOCAddress(identifier, signer.address)

  return {
    data,
    identifier: () => identifier,
    signature: () => signature,
    span: () => chunk.span(),
    payload: () => chunk.payload(),
    address: () => address,
    owner: () => signer.address,
  }
}

/**
 * Helper function to upload a chunk.
 *
 * It uses the Chunk API and calculates the address before uploading.
 *
 * @param requestOptions  Options for making requests
 * @param chunk           A chunk object
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Upload options
 */
export async function uploadSingleOwnerChunk(
  requestOptions: BeeRequestOptions,
  chunk: SingleOwnerChunk,
  stamp: BatchId | Uint8Array | string,
  options?: UploadOptions,
): Promise<UploadResult> {
  const owner = bytesToHex(chunk.owner())
  const identifier = bytesToHex(chunk.identifier())
  const signature = bytesToHex(chunk.signature())
  const data = Binary.concatBytes(chunk.span(), chunk.payload())

  return socAPI.upload(requestOptions, owner, identifier, signature, data, stamp, options)
}

/**
 * Helper function to create and upload SOC.
 *
 * @param requestOptions  Options for making requests
 * @param signer          The singer interface for signing the chunk
 * @param postageBatchId
 * @param identifier      The identifier of the chunk
 * @param data            The chunk data
 * @param options
 */
export async function uploadSingleOwnerChunkData(
  requestOptions: BeeRequestOptions,
  signer: Signer,
  stamp: BatchId | Uint8Array | string,
  identifier: Identifier,
  data: Uint8Array,
  options?: UploadOptions,
): Promise<UploadResult> {
  const cac = makeContentAddressedChunk(data)
  const soc = await makeSingleOwnerChunk(cac, identifier, signer)

  return uploadSingleOwnerChunk(requestOptions, soc, stamp, options)
}

/**
 * Helper function to download SOC.
 *
 * @param url           The url of the Bee service
 * @param ownerAddress  The singer interface for signing the chunk
 * @param identifier    The identifier of the chunk
 */
export async function downloadSingleOwnerChunk(
  requestOptions: BeeRequestOptions,
  ownerAddress: EthAddress,
  identifier: Identifier,
): Promise<SingleOwnerChunk> {
  const address = makeSOCAddress(identifier, ownerAddress)
  const data = await chunkAPI.download(requestOptions, bytesToHex(address))

  return makeSingleOwnerChunkFromData(data, address)
}
