import { safeAxios } from '../../utils/safeAxios'
import { Health, Readiness } from '../../types/debug'

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

/**
 * Get readiness state of node
 *
 * @param url Bee debug URL
 */
export async function getReadiness(url: string): Promise<Readiness> | never {
  const response = await safeAxios<Readiness>({
    method: 'get',
    url: `${url}/readiness`,
    responseType: 'json',
  })

  return response.data
}
