import { Tag } from '../types'
import { safeAxios } from '../utils/safeAxios'

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
    responseType: 'json'
  })
  return response.data
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param tag UID or tag object to be retrieved
 */
export async function retrieveTag(url: string, tag: Tag | number): Promise<Tag> {
  const uid = typeof tag === 'number' ? tag : tag?.uid
  const response = await safeAxios<Tag>({
    url: `${url}${endpoint}/${uid}`
  })
  return response.data
}
