import { ExtendedTag } from '../../types'
import { safeAxios } from '../../utils/safe-axios'

const endpoint = '/tags'

/**
 * Retrieve tag with extended information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveExtendedTag(url: string, uid: number): Promise<ExtendedTag> {
  const response = await safeAxios<ExtendedTag>({
    url: `${url}${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.data
}
