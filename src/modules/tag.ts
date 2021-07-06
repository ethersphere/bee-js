import { Tag } from '../types'
import { safeAxios } from '../utils/safe-axios'

const endpoint = '/tags'

interface GetAllTagsResponse {
  tags: Tag[]
}

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(url: string): Promise<Tag> {
  const response = await safeAxios<Tag>({
    method: 'post',
    url: url + endpoint,
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
export async function retrieveTag(url: string, uid: number): Promise<Tag> {
  const response = await safeAxios<Tag>({
    url: `${url}${endpoint}/${uid}`,
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
export async function getAllTags(url: string, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await safeAxios<GetAllTagsResponse>({
    url: `${url}${endpoint}`,
    params: { offset, limit },
    responseType: 'json',
  })

  return response.data.tags
}

export async function deleteTag(url: string, uid: number): Promise<void> {
  await safeAxios<void>({
    method: 'delete',
    url: `${url}${endpoint}/${uid}`,
  })
}
