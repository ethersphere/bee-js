import type { BeeRequestOptions, RedistributionState } from '../types'
import { GetRedistributionStateResponse } from '../types/schema/stake'
import { http } from '../utils/http'

const redistributionStateEndpoint = 'redistributionstate'

/**
 * Raw HTTP calls for the `/redistributionstate` endpoint.
 */

export async function getRedistributionState(requestOptions: BeeRequestOptions): Promise<RedistributionState> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    responseType: 'json',
    url: redistributionStateEndpoint,
  })

  return GetRedistributionStateResponse.parse(response.data)
}
