import { safeAxios } from '../../utils/safeAxios'

const settlementsEndpoint = '/settlements'

export interface Settlements {
  peer: string
  received: number
  sent: number
}

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
  })

  return response.data
}

export interface AllSettlements {
  totalreceived: number
  totalsent: number
  settlements: Settlements[]
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
  })

  return response.data
}
