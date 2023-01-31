import { http } from '../../utils/http'
import type { Settlements, AllSettlements } from '../../types'
import type { Options as KyOptions } from 'ky'

const settlementsEndpoint = 'settlements'

/**
 * Get amount of sent and received from settlements with a peer
 *
 * @param kyOptions Ky Options for making requests
 * @param peer  Swarm address of peer
 */
export async function getSettlements(kyOptions: KyOptions, peer: string): Promise<Settlements> {
  const response = await http<Settlements>(kyOptions, {
    path: `${settlementsEndpoint}/${peer}`,
    responseType: 'json',
  })

  return response.parsedData
}

/**
 * Get settlements with all known peers and total amount sent or received
 *
 * @param kyOptions Ky Options for making requests
 */
export async function getAllSettlements(kyOptions: KyOptions): Promise<AllSettlements> {
  const response = await http<AllSettlements>(kyOptions, {
    path: settlementsEndpoint,
    responseType: 'json',
  })

  return response.parsedData
}
