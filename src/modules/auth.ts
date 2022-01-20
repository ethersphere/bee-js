import type { Ky } from '../types'
import { http } from '../utils/http'
import { BeeError, BeeUnauthorizedError } from '../utils/error'

const AUTH_ENDPOINT = 'auth'
const REFRESH_ENDPOINT = 'refresh'

/**
 * Authenticate with Bee node retrieving Bearer token that needs to be used for all requests.
 *
 * @param ky        Ky instance
 * @param password  Admin password configured in Bee node configuration
 * @param role      Role of the generated Bearer token
 * @param expiry    Time in seconds
 * @returns string Bearer token that can be used for future requests
 */
export async function authenticate(ky: Ky, password: string, role: string, expiry: number): Promise<string> {
  try {
    const response = await http<{ key: string }>(ky, {
      path: AUTH_ENDPOINT,
      method: 'post',
      responseType: 'json',
      json: {
        role,
        expiry,
      },
      headers: {
        // There is no user in the authorization in Bee so we are passing only "_" as placeholder
        Authorization: `Basic ${Buffer.from('_:' + password).toString('base64')}`,
      },
    })

    return response.data.key
  } catch (e) {
    if (e instanceof BeeUnauthorizedError) {
      throw new BeeError('Incorrect password')
    }

    throw e
  }
}

/**
 * Authenticate with Bee node retrieving Bearer token that needs to be used for all requests.
 *
 * @param ky        Ky instance
 * @param password  Admin password configured in Bee node configuration
 * @param role      Role of the generated Bearer token
 * @param expiry    Time in seconds
 * @returns string Bearer token that can be used for future requests
 */
export async function refresh(ky: Ky, password: string, role: string, expiry: number): Promise<string> {
  try {
    const response = await http<{ key: string }>(ky, {
      path: REFRESH_ENDPOINT,
      method: 'post',
      responseType: 'json',
      json: {
        role,
        expiry,
      },
      headers: {
        // There is no user in the authorization in Bee so we are passing only "_" as placeholder
        Authorization: `Basic ${Buffer.from('_:' + password).toString('base64')}`,
      },
    })

    return response.data.key
  } catch (e) {
    if (e instanceof BeeUnauthorizedError) {
      throw new BeeError('Incorrect password')
    }

    throw e
  }
}
