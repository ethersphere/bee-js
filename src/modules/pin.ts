import * as pinApi from '../api/pin'
import * as stewardshipApi from '../api/stewardship'
import type { BeeRequestOptions, Pin as PinData } from '../types'
import { BatchId, Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * Local pinning operations.
 *
 * Accessed as `bee.pin`.
 */
export class Pin {
  constructor(private readonly context: BeeContext) {}

  /**
   * Pins local data with the given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async add(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<void> {
    const ref = new Reference(reference)

    await pinApi.pin(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Unpins local data with the given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async remove(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<void> {
    const ref = new Reference(reference)

    await pinApi.unpin(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Gets the list of all locally pinned references.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<Reference[]> {
    return pinApi.getAllPins(this.context.getRequestOptionsForCall(requestOptions))
  }

  /**
   * Gets the pinning status of the chunk with the given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<PinData> {
    const ref = new Reference(reference)

    return pinApi.getPin(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Instructs the Bee node to reupload locally pinned data into the network.
   *
   * @param postageBatchId Postage Batch ID that will be used to re-upload the data.
   * @param reference Data reference to be re-uploaded.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async reuploadData(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    const batchId = new BatchId(postageBatchId)
    const ref = new Reference(reference)

    await stewardshipApi.reupload(this.context.getRequestOptionsForCall(requestOptions), batchId, ref)
  }
}
