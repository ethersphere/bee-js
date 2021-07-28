import { http } from '../../utils/http'
import { Settlements, AllSettlements } from '../../types'

const settlementsEndpoint = '/settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function getSettlements(ky: Ky, peer: string): Promise<Settlements> {
  const response = await http<Settlements>({
    url: url + `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param url   Bee debug url
 */
export async function getAllSettlements(ky: Ky): Promise<AllSettlements> {
  const response = await http<AllSettlements>({
    url: url + settlementsEndpoint,
    responseType: 'json',
  })

  return response.data
}
