import { PSS_TARGET_HEX_LENGTH_MAX } from '../types'
import { PeerAddress } from './typed-bytes'

/**
 * Utility function that for given strings/reference takes the most specific
 * target that Bee node will except.
 *
 * @param target is a non-prefixed hex string Bee address
 * @see [Bee docs - PSS](https://docs.ethswarm.org/docs/develop/tools-and-features/pss)
 */
export function makeMaxTarget(target: PeerAddress | Uint8Array | string): string {
  target = new PeerAddress(target)

  return target.toHex().slice(0, PSS_TARGET_HEX_LENGTH_MAX)
}
