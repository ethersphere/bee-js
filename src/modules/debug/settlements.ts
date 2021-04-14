import { safeAxios } from '../../utils/safeAxios'
import { Settlements, AllSettlements } from '../../types'

const settlementsEndpoint = '/settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param url   Bee debug url
 * @param peer  Swarm address of peer
 */
export async function getSettlements(url: string, peer: string): Promise<Settlements> {
  const response = await safeAxios<Settlements>({
    url: url + `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param url   Bee debug url
 */
export async function getAllSettlements(url: string): Promise<AllSettlements> {
  const response = await safeAxios<AllSettlements>({
    url: url + settlementsEndpoint,
    responseType: 'json',
    forceBigInt: true,
  })

  return response.data
}
