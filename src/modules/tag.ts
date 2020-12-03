import axios from 'axios'
import { Tag } from '../types'

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(url: string): Promise<Tag> {
  return (
    await axios({
      method: 'post',
      url: url
    })
  ).data
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param tag UID or tag object to be retrieved
 */
export async function retrieveTag(
  url: string,
  tag: Tag | number
): Promise<Tag> {
  const uid = typeof tag === 'number' ? tag : tag?.uid

  return (
    await axios({
      url: `${url}/${uid}`
    })
  ).data
}
