import { ExtendedTag } from '../../types'
import { http } from '../../utils/http'

const endpoint = '/tags'

/**
 * Retrieve tag with extended information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveExtendedTag(ky: Ky, uid: number): Promise<ExtendedTag> {
  const response = await http<ExtendedTag>({
    url: `${url}${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.data
}
