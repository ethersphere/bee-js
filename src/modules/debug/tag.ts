import { ExtendedTag } from '../../types'
import { http } from '../../utils/http'
import type { Options as KyOptions } from 'ky'

const endpoint = 'tags'

/**
 * Retrieve tag with extended information from Bee node
 *
 * @param kyOptions Ky Options for making requests
 * @param uid UID of tag to be retrieved
 */
export async function retrieveExtendedTag(kyOptions: KyOptions, uid: number): Promise<ExtendedTag> {
  const response = await http<ExtendedTag>(kyOptions, {
    path: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return response.parseData
}
