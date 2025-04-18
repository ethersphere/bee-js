import { Types } from 'cafe-utility'
import { BeeRequestOptions, GetGranteesResult, GranteesResult } from '../types'
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

  const body = Types.asArray(response.data, { name: 'response.data' }).map(
    x => new PublicKey(Types.asString(x, { name: 'grantee' })),
  )

  return {
    status: response.status,
    statusText: response.statusText,
    grantees: body,
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: new Reference(Types.asString(body.ref, { name: 'ref' })),
    historyref: new Reference(Types.asString(body.historyref, { name: 'historyref' })),
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

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    status: response.status,
    statusText: response.statusText,
    ref: new Reference(Types.asString(body.ref, { name: 'ref' })),
    historyref: new Reference(Types.asString(body.historyref, { name: 'historyref' })),
  }
}
