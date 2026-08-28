import { BatchId, EthAddress, keccak256, numberToUint64, PrivateKey, Reference, Topic } from '@ethersphere/core-sdk'
import { BeeError, Bytes } from '..'
import {
  FeedPayloadResult,
  FeedReferenceResult,
  FeedUpdateOptions,
  fetchLatestFeedUpdate,
  probeFeed,
} from '../api/feed'
import { uploadSingleOwnerChunkWithWrappedChunk } from '../chunk/soc'
import {
  downloadFeedUpdate,
  downloadFeedUpdateAsCAC,
  FeedUploadOptions,
  updateFeedWithPayload,
  updateFeedWithReference,
} from '../feed'
import { makeFeedIdentifier } from '../feed/identifier'
import { BeeRequestOptions, UploadResult } from '../types'
import { BeeResponseError } from '../utils/error'
import { BeeContext } from './context'

// Not yet finalized (see ROLLING_FEED.md "Open parameters"): bounds how far catchUp/isCaughtUp
// will scan/backfill so a long-dead writer can't trigger an unbounded loop.
const MAX_CATCH_UP_LOOKBACK = 1000

function periodIndex(t: number, periodLength: number): number {
  if (periodLength <= 0) {
    throw new BeeError('Period length must be greater than zero!')
  }

  return Math.floor(t / periodLength)
}

function topicFor(baseTopic: Topic, periodIdx: number): Topic {
  const baseTopicBytes = baseTopic.toUint8Array()

  return new Topic(keccak256(Bytes.concat(baseTopicBytes, numberToUint64(BigInt(periodIdx), 'BE'))))
}

async function isPeriodPopulated(requestOptions: BeeRequestOptions, owner: EthAddress, topic: Topic): Promise<boolean> {
  try {
    await probeFeed(requestOptions, owner, topic)

    return true
  } catch (e) {
    if (e instanceof BeeResponseError) {
      return false
    }
    throw e
  }
}

async function fetchLatestReference(
  requestOptions: BeeRequestOptions,
  owner: EthAddress,
  topic: Topic,
): Promise<FeedReferenceResult> {
  const { feedIndex } = await probeFeed(requestOptions, owner, topic)
  const update = await downloadFeedUpdate(requestOptions, owner, topic, feedIndex, true)

  return {
    reference: new Reference(update.payload.toUint8Array()),
    feedIndex,
    feedIndexNext: feedIndex.next(),
  }
}

export class RollingFeed {
  constructor(private readonly context: BeeContext) {}

  makeWriter(baseTopic: Topic, signer: PrivateKey, periodLength: number): RollingFeedWriter {
    return new RollingFeedWriter(this.context, baseTopic, signer, periodLength)
  }

  makeReader(baseTopic: Topic, owner: EthAddress, periodLength: number): RollingFeedReader {
    return new RollingFeedReader(this.context, baseTopic, owner, periodLength)
  }
}

export class RollingFeedWriter {
  constructor(
    private readonly context: BeeContext,
    private readonly baseTopic: Topic,
    private readonly signer: PrivateKey,
    private readonly periodLength: number,
  ) {}

  async uploadPayload(
    postageBatchId: string | BatchId,
    payload: Uint8Array | string,
    options?: FeedUploadOptions,
  ): Promise<UploadResult> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const stamp = new BatchId(postageBatchId)
    const { currentTopic, nextTopic, mirrorOptions } = this.currentAndNextTopics(options)

    const [result] = await Promise.all([
      updateFeedWithPayload(requestOptions, this.signer, currentTopic, payload, stamp, options),
      updateFeedWithPayload(requestOptions, this.signer, nextTopic, payload, stamp, mirrorOptions),
    ])

    return result
  }

  async uploadReference(
    postageBatchId: string | BatchId,
    reference: Reference | string | Uint8Array,
    options?: FeedUploadOptions,
  ): Promise<UploadResult> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const stamp = new BatchId(postageBatchId)
    const { currentTopic, nextTopic, mirrorOptions } = this.currentAndNextTopics(options)

    const [result] = await Promise.all([
      updateFeedWithReference(requestOptions, this.signer, currentTopic, reference, stamp, options),
      updateFeedWithReference(requestOptions, this.signer, nextTopic, reference, stamp, mirrorOptions),
    ])

    return result
  }

  /**
   * True unless the period right before `periodIdx` (default: current) never got mirrored
   * forward into it, i.e. the writer went silent for at least one whole period.
   */
  async isCaughtUp(periodIdx?: number): Promise<boolean> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const targetPeriod = periodIdx ?? periodIndex(Date.now() / 1000, this.periodLength)
    const owner = this.signer.publicKey().address()

    return isPeriodPopulated(requestOptions, owner, topicFor(this.baseTopic, targetPeriod))
  }

  /**
   * Backfills every period from the last populated one (exclusive) up to `periodIdx`
   * (default: current) with that period's last known payload/reference.
   */
  async catchUp(postageBatchId: string | BatchId, periodIdx?: number): Promise<void> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const stamp = new BatchId(postageBatchId)
    const owner = this.signer.publicKey().address()
    const targetPeriod = periodIdx ?? periodIndex(Date.now() / 1000, this.periodLength)

    let lastGoodPeriod = targetPeriod - 1

    while (lastGoodPeriod >= targetPeriod - MAX_CATCH_UP_LOOKBACK) {
      if (await isPeriodPopulated(requestOptions, owner, topicFor(this.baseTopic, lastGoodPeriod))) {
        break
      }
      lastGoodPeriod--
    }

    if (lastGoodPeriod < targetPeriod - MAX_CATCH_UP_LOOKBACK) {
      throw new BeeError(`No populated period found within ${MAX_CATCH_UP_LOOKBACK} periods to catch up from!`)
    }

    const sourceTopic = topicFor(this.baseTopic, lastGoodPeriod)
    const { feedIndex: sourceIndex } = await probeFeed(requestOptions, owner, sourceTopic)
    const sourceChunk = await downloadFeedUpdateAsCAC(requestOptions, owner, sourceTopic, sourceIndex)

    for (let period = lastGoodPeriod + 1; period <= targetPeriod; period++) {
      const identifier = makeFeedIdentifier(topicFor(this.baseTopic, period), 0)
      await uploadSingleOwnerChunkWithWrappedChunk(requestOptions, this.signer, stamp, identifier, sourceChunk)
    }
  }

  private currentAndNextTopics(options?: FeedUploadOptions): {
    currentTopic: Topic
    nextTopic: Topic
    mirrorOptions: FeedUploadOptions
  } {
    const currentPeriod = periodIndex(Date.now() / 1000, this.periodLength)

    return {
      currentTopic: topicFor(this.baseTopic, currentPeriod),
      nextTopic: topicFor(this.baseTopic, currentPeriod + 1),
      mirrorOptions: { ...options, index: undefined },
    }
  }
}

export class RollingFeedReader {
  constructor(
    private readonly context: BeeContext,
    private readonly baseTopic: Topic,
    private readonly owner: EthAddress,
    private readonly periodLength: number,
  ) {}

  /**
   * Reads the current period's feed; falls back to the previous period once if empty,
   * to tolerate clock skew between writer and reader.
   */
  async downloadPayload(options?: Omit<FeedUpdateOptions, 'index'>): Promise<FeedPayloadResult> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const currentPeriod = periodIndex(Date.now() / 1000, this.periodLength)

    try {
      return await fetchLatestFeedUpdate(requestOptions, this.owner, topicFor(this.baseTopic, currentPeriod), options)
    } catch (e) {
      if (!(e instanceof BeeResponseError)) {
        throw e
      }

      return fetchLatestFeedUpdate(requestOptions, this.owner, topicFor(this.baseTopic, currentPeriod - 1), options)
    }
  }

  /**
   * Same as `downloadPayload`, but for a reference to data uploaded elsewhere.
   */
  async downloadReference(): Promise<FeedReferenceResult> {
    const requestOptions = this.context.getRequestOptionsForCall()
    const currentPeriod = periodIndex(Date.now() / 1000, this.periodLength)

    try {
      return await fetchLatestReference(requestOptions, this.owner, topicFor(this.baseTopic, currentPeriod))
    } catch (e) {
      if (!(e instanceof BeeResponseError)) {
        throw e
      }

      return fetchLatestReference(requestOptions, this.owner, topicFor(this.baseTopic, currentPeriod - 1))
    }
  }
}
