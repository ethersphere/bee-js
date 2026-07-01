import type { AllSettlements, BeeRequestOptions, Settlements } from '../../types'
import { GetAllSettlementsResponse, GetSettlementsResponse } from '../../types/schema/settlements'
import { http } from '../../utils/http'
import { PeerAddress } from '../../utils/typed-bytes'

const settlementsEndpoint = 'settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getSettlements(requestOptions: BeeRequestOptions, peer: PeerAddress): Promise<Settlements> {
  const response = await http<unknown>(requestOptions, {
    url: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return GetSettlementsResponse.parse(response.data)
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param requestOptions Options for making requests
 */
export async function getAllSettlements(requestOptions: BeeRequestOptions): Promise<AllSettlements> {
  const response = await http<unknown>(requestOptions, {
    url: settlementsEndpoint,
    responseType: 'json',
  })

  return GetAllSettlementsResponse.parse(response.data)
}
