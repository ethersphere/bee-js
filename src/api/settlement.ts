import type { AllSettlements, BeeRequestOptions, Settlements } from '../types'
import { GetAllSettlementsResponse, GetSettlementsResponse } from '../types/schema/settlements'
import { http } from '../utils/http'
import { PeerAddress } from '../utils/typed-bytes'

const settlementsEndpoint = 'settlements'

/**
 * Raw HTTP calls for the `/settlements` endpoint.
 */

export async function getSettlements(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<Settlements> {
  const response = await http<unknown>(requestOptions, {
    url: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return GetSettlementsResponse.parse(response.data)
}

export async function getAllSettlements(requestOptions: BeeRequestOptions): Promise<AllSettlements> {
  const response = await http<unknown>(requestOptions, {
    url: settlementsEndpoint,
    responseType: 'json',
  })

  return GetAllSettlementsResponse.parse(response.data)
}
