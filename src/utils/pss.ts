import { AddressPrefix, PSS_TARGET_HEX_LENGTH_MAX } from '../types'

/**
 * Utility function that for given strings/reference takes the most specific
 * target that Bee node will except.
 *
 * @param target is a non-prefixed hex string Bee address
 * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/dapps-on-swarm/pss)
 */
export function makeMaxTarget(target: string): AddressPrefix {
  if (typeof target !== 'string') {
    throw new TypeError('target has to be an string!')
  }

  return target.slice(0, PSS_TARGET_HEX_LENGTH_MAX)
}
