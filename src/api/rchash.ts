import type { BeeRequestOptions } from '../types/index.js'
import { RchashResponse } from '../types/schema/rchash.js'
import { http } from '../utils/http.js'

const RCHASH_ENDPOINT = 'rchash'

export async function rchash(
  requestOptions: BeeRequestOptions,
  depth: number,
  anchor1: string,
  anchor2: string,
): Promise<number> {
  const response = await http<unknown>(requestOptions, {
    responseType: 'json',
    url: `${RCHASH_ENDPOINT}/${depth}/${anchor1}/${anchor2}`,
  })

  return RchashResponse.parse(response.data).durationSeconds
}
