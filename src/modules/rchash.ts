import { Types } from 'cafe-utility'
import type { BeeRequestOptions } from '../types'
import { http } from '../utils/http'

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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return Types.asNumber(body.durationSeconds, { name: 'durationSeconds' })
}
