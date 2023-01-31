import { ExtendedTag } from '../../types'
import { http } from '../../utils/http'

// @ts-ignore: Needed TS otherwise complains about importing ESM package in CJS even though they are just typings
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

  return response.parsedData
}
