import { safeAxios } from '../../utils/safeAxios'
import type { Health } from '../../types/debug'

/**
 * Get health of node
 *
 * @param url Bee debug URL
 */
export async function getHealth(url: string): Promise<Health> | never {
  const response = await safeAxios<Health>({
    method: 'get',
    url: `${url}/health`,
    responseType: 'json',
  })

  return response.data
}
