import { BatchId } from '../../../src/types'
import { http } from '../../../src/utils/http'
import { actBeeKyOptions, beeKyOptions } from '../../utils'
import * as bzz from '../../../src/modules/bzz'
import * as grantee from '../../../src/modules/grantee'
import { assert, expect } from 'chai'

const BEE_KY_OPTIONS = beeKyOptions()

describe('modules/grantee', () => {
  let publicKey: string
  let batchID: BatchId

  before(async () => {
    const responsePUBK = await http<{ publicKey: string }>(BEE_KY_OPTIONS, {
      method: 'get',
      url: 'addresses',
      responseType: 'json',
    })
    publicKey = responsePUBK.data.publicKey

    const responseBATCHID = await http<{ batchID: BatchId }>(BEE_KY_OPTIONS, {
      method: 'post',
      url: 'stamps/420000000/17',
      responseType: 'json',
    })
    batchID = responseBATCHID.data.batchID
  })
  const grantees = [
    '02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12e8',
    '02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12e9',
    '02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12ee',
  ]
  const patchGrantees = {
    add: ['02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12e8'],
    revoke: [
      '02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12e9',
      '02ceff1422a7026ba54ad89967d81f2805a55eb3d05f64eb5c49ea6024212b12ee',
    ],
  }

  const patchGranteesString = JSON.stringify(patchGrantees)
  it('should create grantee list', async function () {
    const response = await grantee.createGrantees(BEE_KY_OPTIONS, batchID, grantees)
    expect(response.ref).to.have.lengthOf(128)
    expect(response.historyref).to.have.lengthOf(64)
  })

  it('should download grantee list', async function () {
    const response = await grantee.createGrantees(BEE_KY_OPTIONS, batchID, grantees)
    const list = await grantee.getGrantees(response.ref, BEE_KY_OPTIONS)
    expect(list.data).to.have.lengthOf(grantees.length)
    list.data.forEach((element: string, _index: number) => {
      assert.isTrue(grantees.includes(element))
    })
  })

  it('should patch grantee list', async function () {
    const filename = 'act-4.txt'
    const data = 'hello act grantees!'
    const uploadResult = await bzz.uploadFile(BEE_KY_OPTIONS, data, batchID, filename, { act: true })

    const createResponse = await grantee.createGrantees(BEE_KY_OPTIONS, batchID, grantees)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const patchResponse = await grantee.patchGrantees(
      createResponse.ref,
      uploadResult.history_address,
      batchID,
      patchGranteesString,
      BEE_KY_OPTIONS,
    )
    const list = await grantee.getGrantees(patchResponse.ref, BEE_KY_OPTIONS)

    expect(list.data).to.have.lengthOf(1)
    expect(list.data[0]).to.eql(patchGrantees.add[0])

    const requestOptionsOK = actBeeKyOptions(publicKey, patchResponse.historyref, '1')
    const dFile = await bzz.downloadFile(requestOptionsOK, uploadResult.reference, filename)

    expect(Buffer.from(dFile.data).toString()).to.eql(data)
  })
})
