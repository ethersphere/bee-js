import type { BeeRequestOptions, RedistributionState } from '../types/index.js'
import { GetRedistributionStateResponse, RedistributionToggleResponse } from '../types/schema/stake.js'
import { http } from '../utils/http.js'

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

export async function setRedistributionEnabled(requestOptions: BeeRequestOptions, enabled: boolean): Promise<boolean> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    responseType: 'json',
    url: redistributionStateEndpoint,
    data: { enabled },
  })

  return RedistributionToggleResponse.parse(response.data).enabled
}
