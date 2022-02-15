import { http } from '../../utils/http.js'

import type { ExtendedTag, Ky } from '../../types/index.js'

const endpoint = 'tags'

/**
 * Retrieve tag with extended information from Bee node
 *
 * @param ky Ky debug instance
 * @param uid UID of tag to be retrieved
 */
export async function retrieveExtendedTag(ky: Ky, uid: number): Promise<ExtendedTag> {
  const response = await http<ExtendedTag>(ky, {
    path: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.data
}
