import { Bee } from '../../../src'
import * as bzz from '../../../src/modules/bzz'
import * as grantee from '../../../src/modules/grantee'
import { actBeeKyOptions, beeKyOptions, beeUrl, getPostageBatch } from '../../utils'

const BEE_REQUEST_OPTIONS = beeKyOptions()

describe('modules/grantee', () => {
  let publicKey: string

  beforeAll(async () => {
    publicKey = (await new Bee(beeUrl()).getNodeAddresses()).publicKey
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

  it('should create grantee list', async function () {
    const response = await grantee.createGrantees(BEE_REQUEST_OPTIONS, getPostageBatch(), grantees)
    expect(response.ref).toHaveLength(128)
    expect(response.historyref).toHaveLength(64)
  })

  it('should download grantee list', async function () {
    const response = await grantee.createGrantees(BEE_REQUEST_OPTIONS, getPostageBatch(), grantees)
    const list = await grantee.getGrantees(response.ref, BEE_REQUEST_OPTIONS)
    expect(list.data).toHaveLength(grantees.length)
    list.data.forEach((element: string, _index: number) => {
      expect(grantees.includes(element)).toBeTruthy()
    })
  })

  it('should patch grantee list', async function () {
    const filename = 'act-4.txt'
    const data = 'hello act grantees!'
    const uploadResult = await bzz.uploadFile(BEE_REQUEST_OPTIONS, data, getPostageBatch(), filename, { act: true })

    const createResponse = await grantee.createGrantees(BEE_REQUEST_OPTIONS, getPostageBatch(), grantees)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const patchResponse = await grantee.patchGrantees(
      getPostageBatch(),
      createResponse.ref,
      uploadResult.historyAddress,
      patchGrantees,
      BEE_REQUEST_OPTIONS,
    )
    const list = await grantee.getGrantees(patchResponse.ref, BEE_REQUEST_OPTIONS)

    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toBe(patchGrantees.add[0])

    const requestOptionsOK = actBeeKyOptions(publicKey, patchResponse.historyref, '1')
    const dFile = await bzz.downloadFile(requestOptionsOK, uploadResult.reference, filename)

    expect(Buffer.from(dFile.data).toString()).toBe(data)
  })
})
