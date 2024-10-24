import { BatchId, BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
import { extractRedundantUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'

const granteeEndpoint = 'grantee'

export async function getGrantees(reference: string, requestOptions: BeeRequestOptions): Promise<GetGranteesResult> {
  const response = await http<string[]>(requestOptions, {
    method: 'get',
    url: `${granteeEndpoint}/${reference}`,
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
  }
}

export async function createGrantees(
  requestOptions: BeeRequestOptions,
  postageBatchId: BatchId,
  grantees: string[],
): Promise<GranteesResult> {
  const response = await http<GranteesResult>(requestOptions, {
    method: 'post',
    url: granteeEndpoint,
    data: { grantees },
    headers: {
      ...extractRedundantUploadHeaders(postageBatchId),
    },
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: response.data.ref,
    historyref: response.data.historyref,
  }
}

export async function patchGrantees(
  postageBatchId: BatchId,
  reference: string,
  historyRef: string,
  grantees: { add?: string[]; revoke?: string[] },
  requestOptions: BeeRequestOptions,
): Promise<GranteesResult> {
  const response = await http<GranteesResult>(requestOptions, {
    method: 'patch',
    url: `${granteeEndpoint}/${reference}`,
    data: grantees,
    headers: {
      ...extractRedundantUploadHeaders(postageBatchId),
      'swarm-act-history-address': historyRef,
    },
    responseType: 'json',
  })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: response.data.ref,
    historyref: response.data.historyref,
  }
}
