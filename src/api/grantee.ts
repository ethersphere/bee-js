import type { BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
import { GetGranteesBodyResponse, GranteesResultBodyResponse } from '../types/schema/grantee'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BatchId, PublicKey, Reference } from '../utils/typed-bytes'

const granteeEndpoint = 'grantee'

/** Creates grantees for a postage batch. */
export async function createGrantees(
  requestOptions: BeeRequestOptions,
  batchId: BatchId,
  publicKeys: PublicKey[],
): Promise<GranteesResult> {
  const response = await http<unknown>(requestOptions, {
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

/** Retrieves the grantees for a given reference. */
export async function getGrantees(requestOptions: BeeRequestOptions, reference: Reference): Promise<GetGranteesResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'get',
    url: `${granteeEndpoint}/${reference}`,
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    grantees: GetGranteesBodyResponse.parse(response.data),
  }
}

/** Updates the grantees of a specific reference and history. */
export async function patchGrantees(
  requestOptions: BeeRequestOptions,
  batchId: BatchId,
  reference: Reference,
  history: Reference,
  publicKeys: { add: PublicKey[]; revoke: PublicKey[] },
): Promise<GranteesResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${granteeEndpoint}/${reference}`,
    data: {
      add: publicKeys.add.map(x => x.toCompressedHex()),
      revoke: publicKeys.revoke.map(x => x.toCompressedHex()),
    },
    headers: {
      ...prepareRequestHeaders(batchId),
      'swarm-act-history-address': history.toHex(),
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
