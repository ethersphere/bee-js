import { safeAxios } from '../utils/safeAxios'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param url Bee URL
 */
export async function checkConnection(url: string): Promise<void> | never {
  await safeAxios<string>({
    url: url,
    responseType: 'json',
  })
}
