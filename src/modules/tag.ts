import { http } from '../utils/http.js'

import type { Ky, Reference, Tag } from '../types/index.js'

const endpoint = 'tags'

interface GetAllTagsResponse {
  tags: Tag[]
}

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(ky: Ky): Promise<Tag> {
  const response = await http<Tag>(ky, {
    method: 'post',
    path: endpoint,
    responseType: 'json',
  })

  return response.data
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveTag(ky: Ky, uid: number): Promise<Tag> {
  const response = await http<Tag>(ky, {
    path: `${endpoint}/${uid}`,
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
export async function getAllTags(ky: Ky, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await http<GetAllTagsResponse>(ky, {
    path: `${endpoint}`,
    searchParams: { offset, limit },
    responseType: 'json',
  })

  return response.data.tags
}

/**
 * Removes tag from the Bee node.
 * @param url
 * @param uid
 */
export async function deleteTag(ky: Ky, uid: number): Promise<void> {
  await http<void>(ky, {
    method: 'delete',
    path: `${endpoint}/${uid}`,
  })
}

/**
 * Updates tag
 * @param url
 * @param uid
 * @param reference
 */
export async function updateTag(ky: Ky, uid: number, reference: Reference): Promise<void> {
  await http<void>(ky, {
    method: 'patch',
    path: `${endpoint}/${uid}`,
    json: {
      reference,
    },
  })
}
