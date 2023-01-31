import { Reference, Tag } from '../types'
import { http } from '../utils/http'
import type { Options as KyOptions } from 'ky'

const endpoint = 'tags'

interface GetAllTagsResponse {
  tags: Tag[]
}

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(kyOptions: KyOptions): Promise<Tag> {
  const response = await http<Tag>(kyOptions, {
    method: 'post',
    path: endpoint,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveTag(kyOptions: KyOptions, uid: number): Promise<Tag> {
  const response = await http<Tag>(kyOptions, {
    path: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get limited listing of all tags.
 *
 * @param url
 * @param offset
 * @param limit
 */
export async function getAllTags(kyOptions: KyOptions, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await http<GetAllTagsResponse>(kyOptions, {
    path: `${endpoint}`,
    searchParams: { offset, limit },
    responseType: 'json',
  })

  return response.parsedData.tags
}

/**
 * Removes tag from the Bee node.
 * @param url
 * @param uid
 */
export async function deleteTag(kyOptions: KyOptions, uid: number): Promise<void> {
  await http<void>(kyOptions, {
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
export async function updateTag(kyOptions: KyOptions, uid: number, reference: Reference): Promise<void> {
  await http<void>(kyOptions, {
    method: 'patch',
    path: `${endpoint}/${uid}`,
    json: {
      reference,
    },
  })
}
