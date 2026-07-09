import type { BeeRequestOptions, Pin as PinData } from '../types'
import { GetAllPinsResponse } from '../types/schema/pinning'
import { UploadResultBody } from '../types/schema/upload'
import { http } from '../utils/http'
import { BatchId, Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const PINNING_ENDPOINT = 'pins'
const STEWARDSHIP_ENDPOINT = 'stewardship'

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

    await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      responseType: 'json',
      url: `${PINNING_ENDPOINT}/${ref}`,
    })
  }

  /**
   * Unpins local data with the given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async remove(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<void> {
    const ref = new Reference(reference)

    await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'delete',
      responseType: 'json',
      url: `${PINNING_ENDPOINT}/${ref}`,
    })
  }

  /**
   * Gets the list of all locally pinned references.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(requestOptions?: BeeRequestOptions): Promise<Reference[]> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      responseType: 'json',
      url: PINNING_ENDPOINT,
    })

    const { references } = GetAllPinsResponse.parse(response.data)

    return (references ?? []).map(x => new Reference(x))
  }

  /**
   * Gets the pinning status of the chunk with the given reference.
   *
   * @param reference Data reference
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(reference: Reference | Uint8Array | string, requestOptions?: BeeRequestOptions): Promise<PinData> {
    const ref = new Reference(reference)

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      responseType: 'json',
      url: `${PINNING_ENDPOINT}/${ref}`,
    })

    return UploadResultBody.parse(response.data)
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

    await http(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'put',
      url: `${STEWARDSHIP_ENDPOINT}/${ref}`,
      headers: { 'swarm-postage-batch-id': batchId.toHex() },
    })
  }
}
