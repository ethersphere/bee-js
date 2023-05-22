import { BeeRequestOptions, ExtendedTag } from '../../types'
import { http } from '../../utils/http'

const endpoint = 'tags'

/**
 * Retrieve tag with extended information from Bee node
 *
 * @param kyOptions Ky Options for making requests
 * @param uid UID of tag to be retrieved
 */
export async function retrieveExtendedTag(requestOptions: BeeRequestOptions, uid: number): Promise<ExtendedTag> {
  const response = await http<ExtendedTag>(requestOptions, {
    url: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.data
}
