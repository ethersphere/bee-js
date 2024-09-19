import type { AllSettlements, BeeRequestOptions, Settlements } from '../../types'
import { http } from '../../utils/http'

const settlementsEndpoint = 'settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param requestOptions Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getSettlements(requestOptions: BeeRequestOptions, peer: string): Promise<Settlements> {
  const response = await http<Settlements>(requestOptions, {
    url: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param requestOptions Options for making requests
 */
export async function getAllSettlements(requestOptions: BeeRequestOptions): Promise<AllSettlements> {
  const response = await http<AllSettlements>(requestOptions, {
    url: settlementsEndpoint,
    responseType: 'json',
  })

  return response.data
}
