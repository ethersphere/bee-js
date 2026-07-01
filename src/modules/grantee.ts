import { BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
import { GetGranteesBodyResponse, GranteesResultBodyResponse } from '../types/schema/grantee'
import { prepareRequestHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { BatchId, PublicKey, Reference } from '../utils/typed-bytes'

const granteeEndpoint = 'grantee'

export async function getGrantees(reference: Reference, requestOptions: BeeRequestOptions): Promise<GetGranteesResult> {
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

export async function createGrantees(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  grantees: PublicKey[],
): Promise<GranteesResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: granteeEndpoint,
    data: { grantees: grantees.map(x => x.toCompressedHex()) },
    headers: prepareRequestHeaders(postageBatchId),
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

export async function patchGrantees(
  postageBatchId: BatchId,
  reference: Reference,
  historyRef: Reference,
  grantees: { add?: PublicKey[]; revoke?: PublicKey[] },
  requestOptions: BeeRequestOptions,
): Promise<GranteesResult> {
  const response = await http<unknown>(requestOptions, {
    method: 'patch',
    url: `${granteeEndpoint}/${reference}`,
    data: {
      add: grantees.add?.map(x => x.toCompressedHex()),
      revoke: grantees.revoke?.map(x => x.toCompressedHex()),
    },
    headers: {
      ...prepareRequestHeaders(postageBatchId),
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
