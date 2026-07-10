import * as api from '../api/tag'
import type { AllTagsOptions, BeeRequestOptions, Tag as TagData } from '../types'
import { AllTagsOptionsSchema } from '../utils/schema'
import { makeTagUid } from '../utils/type'
import { Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

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
    return api.createTag(this.context.getRequestOptionsForCall(requestOptions))
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

    return api.getAllTags(this.context.getRequestOptionsForCall(requestOptions), options)
  }

  /**
   * Retrieves tag information from the Bee node.
   *
   * @param tagUid UID or tag object to be retrieved
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(tagUid: number | TagData, requestOptions?: BeeRequestOptions): Promise<TagData> {
    const uid = makeTagUid(tagUid)

    return api.getTag(this.context.getRequestOptionsForCall(requestOptions), uid)
  }

  /**
   * Deletes a tag.
   *
   * @param tagUid UID or tag object to be deleted
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async delete(tagUid: number | TagData, requestOptions?: BeeRequestOptions): Promise<void> {
    const uid = makeTagUid(tagUid)

    await api.deleteTag(this.context.getRequestOptionsForCall(requestOptions), uid)
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

    await api.updateTag(this.context.getRequestOptionsForCall(requestOptions), uid, ref)
  }
}
