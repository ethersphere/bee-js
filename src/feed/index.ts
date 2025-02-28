import { Binary, Optional, Types } from 'cafe-utility'
import { asContentAddressedChunk, Chunk } from '../chunk/cac'
import {
  makeSingleOwnerChunkFromData,
  uploadSingleOwnerChunkData,
  uploadSingleOwnerChunkWithWrappedChunk,
} from '../chunk/soc'
import * as bytes from '../modules/bytes'
import * as chunkAPI from '../modules/chunk'
import {
  FeedPayloadResult,
  FeedReferenceResult,
  FeedUpdateOptions,
  fetchLatestFeedUpdate,
  probeFeed,
} from '../modules/feed'
import { BeeRequestOptions, FeedReader, FeedWriter, UploadOptions, UploadResult } from '../types'
import { Bytes } from '../utils/bytes'
import { BeeResponseError } from '../utils/error'
import { ResourceLocator } from '../utils/resource-locator'
import {
  BatchId,
  EthAddress,
  FeedIndex,
  Identifier,
  PrivateKey,
  Reference,
  Signature,
  Topic,
} from '../utils/typed-bytes'
import { makeFeedIdentifier } from './identifier'

const TIMESTAMP_PAYLOAD_OFFSET = 0
const TIMESTAMP_PAYLOAD_SIZE = 8
const REFERENCE_PAYLOAD_OFFSET = TIMESTAMP_PAYLOAD_SIZE

export interface Epoch {
  time: number
  level: number
}

export interface FeedUploadOptions extends UploadOptions, FeedUpdateOptions {}

export interface FeedUpdate {
  timestamp: Optional<number>
  payload: Bytes
}

export async function findNextIndex(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
): Promise<FeedIndex> {
  try {
    const feedUpdate = await fetchLatestFeedUpdate(requestOptions, owner, topic)

    if (!feedUpdate.feedIndexNext) {
      throw Error('Feed index next is not defined. This should happen when fetching an exact index.')
    }

    return feedUpdate.feedIndexNext
  } catch (e) {
    if (e instanceof BeeResponseError) {
      return FeedIndex.fromBigInt(0n)
    }
    throw e
  }
}

export async function updateFeedWithReference(
  requestOptions: BeeRequestOptions,
  signer: PrivateKey,
  topic: Topic,
  reference: Reference | string | Uint8Array,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
): Promise<UploadResult> {
  reference = new Reference(reference)
  const nextIndex = options?.index ?? (await findNextIndex(requestOptions, signer.publicKey().address(), topic))

  const identifier = makeFeedIdentifier(topic, nextIndex)
  const at = options?.at ?? Date.now() / 1000.0
  const timestamp = Binary.numberToUint64(BigInt(Math.floor(at)), 'BE')
  const payloadBytes = Binary.concatBytes(timestamp, reference.toUint8Array())

  return uploadSingleOwnerChunkData(requestOptions, signer, postageBatchId, identifier, payloadBytes, options)
}

export async function updateFeedWithPayload(
  requestOptions: BeeRequestOptions,
  signer: PrivateKey,
  topic: Topic,
  data: Uint8Array | string,
  postageBatchId: BatchId,
  options?: FeedUploadOptions,
): Promise<UploadResult> {
  const nextIndex = options?.index ?? (await findNextIndex(requestOptions, signer.publicKey().address(), topic))

  const identifier = makeFeedIdentifier(topic, nextIndex)

  if (data.length > 4096) {
    const uploadResult = await bytes.upload(requestOptions, data, postageBatchId, options)
    const rootChunk = await chunkAPI.download(requestOptions, uploadResult.reference)
    return uploadSingleOwnerChunkWithWrappedChunk(
      requestOptions,
      signer,
      postageBatchId,
      identifier,
      rootChunk,
      options,
    )
  }

  return uploadSingleOwnerChunkData(
    requestOptions,
    signer,
    postageBatchId,
    identifier,
    Types.isString(data) ? Bytes.fromUtf8(data).toUint8Array() : data,
    options,
  )
}

export function getFeedUpdateChunkReference(owner: EthAddress, topic: Topic, index: FeedIndex): Reference {
  const identifier = makeFeedIdentifier(topic, index)

  return new Reference(Binary.keccak256(Binary.concatBytes(identifier.toUint8Array(), owner.toUint8Array())))
}

export async function downloadFeedUpdate(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  index: FeedIndex | number,
  hasTimestamp = false,
): Promise<FeedUpdate> {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index
  const address = getFeedUpdateChunkReference(owner, topic, index)
  const data = await chunkAPI.download(requestOptions, address.toHex())
  const soc = makeSingleOwnerChunkFromData(data, address)
  let timestamp: Optional<number> = Optional.empty()

  if (hasTimestamp) {
    const timestampBytes = Bytes.fromSlice(soc.payload.toUint8Array(), TIMESTAMP_PAYLOAD_OFFSET, TIMESTAMP_PAYLOAD_SIZE)
    timestamp = Optional.of(Number(Binary.uint64ToNumber(timestampBytes.toUint8Array(), 'BE')))
  }

  return {
    timestamp,
    payload: new Bytes(soc.payload.offset(hasTimestamp ? REFERENCE_PAYLOAD_OFFSET : 0)),
  }
}

export async function downloadFeedUpdateAsCAC(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
  index: FeedIndex | number,
): Promise<Chunk> {
  index = typeof index === 'number' ? FeedIndex.fromBigInt(BigInt(index)) : index
  const address = getFeedUpdateChunkReference(owner, topic, index)
  const data = await chunkAPI.download(requestOptions, address)

  return asContentAddressedChunk(data.slice(Identifier.LENGTH + Signature.LENGTH))
}

export function makeFeedReader(requestOptions: BeeRequestOptions, topic: Topic, owner: EthAddress): FeedReader {
  // TODO: remove after enough time has passed in deprecated version
  const download = async (options?: FeedUpdateOptions): Promise<FeedPayloadResult> => {
    if (options?.index === undefined) {
      return fetchLatestFeedUpdate(requestOptions, owner, topic)
    }

    const update = await downloadFeedUpdate(requestOptions, owner, topic, options.index, options.hasTimestamp ?? true)

    const feedIndex = typeof options.index === 'number' ? FeedIndex.fromBigInt(BigInt(options.index)) : options.index

    return {
      payload: update.payload,
      feedIndex,
    }
  }

  const downloadPayload = async (options?: FeedUpdateOptions): Promise<FeedPayloadResult> => {
    if (options?.index === undefined) {
      return fetchLatestFeedUpdate(requestOptions, owner, topic)
    }

    const cac = await downloadFeedUpdateAsCAC(requestOptions, owner, topic, options.index)

    const payload =
      cac.span.toBigInt() <= 4096n
        ? cac.payload
        : await bytes.download(requestOptions, new ResourceLocator(cac.address))

    const feedIndex = typeof options.index === 'number' ? FeedIndex.fromBigInt(BigInt(options.index)) : options.index

    return {
      payload,
      feedIndex,
    }
  }

  const downloadReference = async (options?: FeedUpdateOptions): Promise<FeedReferenceResult> => {
    let index = options?.index

    if (index === undefined) {
      index = (await probeFeed(requestOptions, owner, topic)).feedIndex
    }

    const payload = await download({ ...options, index: index })

    return {
      reference: new Reference(payload.payload.toUint8Array()),
      feedIndex: payload.feedIndex,
    }
  }

  return {
    download,
    downloadPayload,
    downloadReference,
    owner,
    topic,
  }
}

export function makeFeedWriter(requestOptions: BeeRequestOptions, topic: Topic, signer: PrivateKey): FeedWriter {
  const upload = async (
    postageBatchId: BatchId,
    reference: Reference | string | Uint8Array,
    options?: FeedUploadOptions,
  ) => {
    return updateFeedWithReference(requestOptions, signer, topic, reference, postageBatchId, options)
  }

  const uploadPayload = async (postageBatchId: BatchId, data: Uint8Array | string, options?: FeedUploadOptions) => {
    return updateFeedWithPayload(requestOptions, signer, topic, data, postageBatchId, options)
  }

  return {
    ...makeFeedReader(requestOptions, topic, signer.publicKey().address()),
    upload,
    uploadReference: upload,
    uploadPayload,
  }
}
