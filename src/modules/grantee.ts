import * as api from '../api/grantee'
import type { BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
import { BatchId, PublicKey, Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

/**
 * Grantee (access control) operations.
 *
 * Accessed as `bee.grantee`.
 */
export class Grantee {
  constructor(private readonly context: BeeContext) {}

  /**
   * Creates grantees for a postage batch.
   *
   * @param postageBatchId
   * @param grantees Public keys of the grantees.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async create(
    postageBatchId: BatchId | Uint8Array | string,
    grantees: PublicKey[] | Uint8Array[] | string[],
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    const batchId = new BatchId(postageBatchId)
    const publicKeys = grantees.map(x => new PublicKey(x))

    return api.createGrantees(this.context.getRequestOptionsForCall(requestOptions), batchId, publicKeys)
  }

  /**
   * Retrieves the grantees for a given reference.
   *
   * @param reference The reference.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async get(
    reference: Reference | Uint8Array | string,
    requestOptions?: BeeRequestOptions,
  ): Promise<GetGranteesResult> {
    const ref = new Reference(reference)

    return api.getGrantees(this.context.getRequestOptionsForCall(requestOptions), ref)
  }

  /**
   * Updates the grantees of a specific reference and history.
   *
   * @param postageBatchId The ID of the postage batch.
   * @param reference The reference.
   * @param history The history.
   * @param grantees The grantees to add and/or revoke.
   * @param requestOptions Options for making requests, such as timeouts, custom HTTP agents, headers, etc.
   */
  async patch(
    postageBatchId: BatchId | Uint8Array | string,
    reference: Reference | Uint8Array | string,
    history: Reference | Uint8Array | string,
    grantees: { add?: PublicKey[] | Uint8Array[] | string[]; revoke?: PublicKey[] | Uint8Array[] | string[] },
    requestOptions?: BeeRequestOptions,
  ): Promise<GranteesResult> {
    const batchId = new BatchId(postageBatchId)
    const ref = new Reference(reference)
    const historyRef = new Reference(history)
    const publicKeys = {
      add: grantees.add?.map(x => new PublicKey(x)) ?? [],
      revoke: grantees.revoke?.map(x => new PublicKey(x)) ?? [],
    }

    return api.patchGrantees(
      this.context.getRequestOptionsForCall(requestOptions),
      batchId,
      ref,
      historyRef,
      publicKeys,
    )
  }
}
