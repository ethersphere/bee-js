import { Tag } from '../types'
import { safeAxios } from '../utils/safe-axios'

const endpoint = '/tags'

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
  })

  return response.data
}
