import { BeeRequestOptions, Tag } from '../types'
import { GetAllTagsResponse, TagSchema } from '../types/schema/tag'
import { http } from '../utils/http'
import { Reference } from '../utils/typed-bytes'

const endpoint = 'tags'

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(requestOptions: BeeRequestOptions): Promise<Tag> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: endpoint,
    responseType: 'json',
  })

  return TagSchema.parse(response.data)
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveTag(requestOptions: BeeRequestOptions, uid: number): Promise<Tag> {
  const response = await http<unknown>(requestOptions, {
    url: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return TagSchema.parse(response.data)
}

/**
 * Get limited listing of all tags.
 *
 * @param url
 * @param offset
 * @param limit
 */
export async function getAllTags(requestOptions: BeeRequestOptions, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await http<unknown>(requestOptions, {
    url: endpoint,
    params: { offset, limit },
    responseType: 'json',
  })

  return GetAllTagsResponse.parse(response.data).tags
}

/**
 * Removes tag from the Bee node.
 * @param url
 * @param uid
 */
export async function deleteTag(requestOptions: BeeRequestOptions, uid: number): Promise<void> {
  await http<void>(requestOptions, {
    method: 'delete',
    url: `${endpoint}/${uid}`,
  })
}

/**
 * Updates tag
 * @param url
 * @param uid
 * @param reference
 */
export async function updateTag(requestOptions: BeeRequestOptions, uid: number, reference: Reference): Promise<void> {
  await http<void>(requestOptions, {
    method: 'patch',
    url: `${endpoint}/${uid}`,
    data: {
      reference,
    },
  })
}
