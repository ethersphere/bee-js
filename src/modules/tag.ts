import { BeeRequestOptions, Reference, Tag } from '../types'
import { EthAddress } from '../utils/eth'
import { http } from '../utils/http'

const endpoint = 'tags'

interface GetAllTagsResponse {
  tags: Tag[]
}

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(requestOptions: BeeRequestOptions, address?: EthAddress | string): Promise<Tag> {
  const response = await http<Tag>(requestOptions, {
    method: 'post',
    url: endpoint,
    responseType: 'json',
    params: address,
  })

  return response.data
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveTag(requestOptions: BeeRequestOptions, uid: number): Promise<Tag> {
  const response = await http<Tag>(requestOptions, {
    url: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get limited listing of all tags.
 *
 * @param url
 * @param offset
 * @param limit
 */
export async function getAllTags(requestOptions: BeeRequestOptions, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await http<GetAllTagsResponse>(requestOptions, {
    url: endpoint,
    params: { offset, limit },
    responseType: 'json',
  })

  return response.data.tags
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
