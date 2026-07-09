import type { AllTagsOptions, BeeRequestOptions, Tag as TagData } from '../types'
import { GetAllTagsResponse, TagSchema } from '../types/schema/tag'
import { http } from '../utils/http'
import { AllTagsOptionsSchema } from '../utils/schema'
import { makeTagUid } from '../utils/type'
import { Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const endpoint = 'tags'

/**
 * Tag operations for tracking upload and synchronization progress.
 *
 * Accessed as `bee.tag`.
 */
export class Tag {
  constructor(private readonly context: BeeContext) {}

  /**
   * Creates a new tag which is meant for tracking upload and synchronization progress.
   *
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async create(requestOptions?: BeeRequestOptions): Promise<TagData> {
    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: endpoint,
      responseType: 'json',
    })

    return TagSchema.parse(response.data)
  }

  /**
   * Fetches all tags in a paginated manner.
   *
   * @param options Specify `limit` and `offset` to paginate through the tags.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async getAll(options?: AllTagsOptions, requestOptions?: BeeRequestOptions): Promise<TagData[]> {
    if (options) {
      options = AllTagsOptionsSchema.parse(options)
    }

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: endpoint,
      params: { offset: options?.offset, limit: options?.limit },
      responseType: 'json',
    })

    return GetAllTagsResponse.parse(response.data).tags
  }

  /**
   * Retrieves tag information from the Bee node.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(tagUid: number | TagData, requestOptions?: BeeRequestOptions): Promise<TagData> {
    const uid = makeTagUid(tagUid)

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      url: `${endpoint}/${uid}`,
      responseType: 'json',
    })

    return TagSchema.parse(response.data)
  }

  /**
   * Deletes a tag.
   *
   * @param tagUid UID or tag object to be deleted
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async delete(tagUid: number | TagData, requestOptions?: BeeRequestOptions): Promise<void> {
    const uid = makeTagUid(tagUid)

    await http<void>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'delete',
      url: `${endpoint}/${uid}`,
    })
  }

  /**
   * Updates a tag's total chunks count.
   *
   * @param tagUid UID or tag object to be updated
   * @param reference The root reference that contains all the chunks to be counted
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async update(
    tagUid: number | TagData,
    reference: Reference | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<void> {
    const ref = new Reference(reference)
    const uid = makeTagUid(tagUid)

    await http<void>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'patch',
      url: `${endpoint}/${uid}`,
      data: { reference: ref },
    })
  }
}
