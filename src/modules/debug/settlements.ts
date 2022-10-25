import { http } from '../../utils/http'
import type { Settlements, AllSettlements, Ky } from '../../types'

const settlementsEndpoint = 'settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param ky Ky debug instance
 * @param peer  Swarm address of peer
 */
export async function getSettlements(ky: Ky, peer: string): Promise<Settlements> {
  const response = await http<Settlements>(ky, {
    path: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param ky Ky debug instance
 */
export async function getAllSettlements(ky: Ky): Promise<AllSettlements> {
  const response = await http<AllSettlements>(ky, {
    path: settlementsEndpoint,
    responseType: 'json',
  })

  return response.parsedData
}
