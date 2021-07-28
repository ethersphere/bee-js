import { http } from '../utils/http'

/**
 * Ping the base bee URL. If connection was not successful throw error
 *
 * @param url Bee URL
 */
export async function checkConnection(ky: Ky): Promise<void> | never {
  await http<string>({
    url: url,
    responseType: 'json',
  })
}
