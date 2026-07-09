import type { Bee } from '../bee'
import type { BeeRequestOptions } from '../types'
import type { PrivateKey } from '../utils/typed-bytes'

/**
 * Facade a Bee instance hands to each module (namespace) class.
 *
 * Exposes the shared state and helpers modules need — so modules stay decoupled
 * from the `Bee` class internals, nothing leaks onto the public `bee.` surface,
 * and modules can be unit-tested with a plain object.
 */
export interface BeeContext {
  /**
   * Merges per-call request options with the Bee instance defaults.
   */
  getRequestOptionsForCall(requestOptions?: BeeRequestOptions): BeeRequestOptions
  readonly url: string
  readonly signer?: PrivateKey
  readonly network: 'gnosis' | 'sepolia'
  /**
   * The owning Bee instance — used only for cross-namespace orchestration
   * (e.g. `bee.stamp.create` reading `bee.status.getChainState()`).
   */
  readonly bee: Bee
}
