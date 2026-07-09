import type { BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
import { GetGranteesBodyResponse, GranteesResultBodyResponse } from '../types/schema/grantee'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BatchId, PublicKey, Reference } from '../utils/typed-bytes'
import type { BeeContext } from './context'

const granteeEndpoint = 'grantee'

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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'post',
      url: granteeEndpoint,
      data: { grantees: publicKeys.map(x => x.toCompressedHex()) },
      headers: prepareRequestHeaders(batchId),
      responseType: 'json',
    })

    const body = GranteesResultBodyResponse.parse(response.data)

    return {
      status: response.status,
      statusText: response.statusText,
      ref: body.ref,
      historyref: body.historyref,
    }
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'get',
      url: `${granteeEndpoint}/${ref}`,
      responseType: 'json',
    })

    return {
      status: response.status,
      statusText: response.statusText,
      grantees: GetGranteesBodyResponse.parse(response.data),
    }
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

    const response = await http<unknown>(this.context.getRequestOptionsForCall(requestOptions), {
      method: 'patch',
      url: `${granteeEndpoint}/${ref}`,
      data: {
        add: publicKeys.add.map(x => x.toCompressedHex()),
        revoke: publicKeys.revoke.map(x => x.toCompressedHex()),
      },
      headers: {
        ...prepareRequestHeaders(batchId),
        'swarm-act-history-address': historyRef.toHex(),
      },
      responseType: 'json',
    })

    const body = GranteesResultBodyResponse.parse(response.data)

    return {
      status: response.status,
      statusText: response.statusText,
      ref: body.ref,
      historyref: body.historyref,
    }
  }
}
