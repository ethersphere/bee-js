import { Dates, System } from 'cafe-utility'
import { batch, makeBee } from '../utils'

const bee = makeBee()

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

test('CRUD grantee', async () => {
  // create
  const createResponse = await bee.createGrantees(batch(), grantees)
  expect(createResponse.ref.length).toBe(64)
  expect(createResponse.historyref.length).toBe(32)

  // get
  const list = await bee.getGrantees(createResponse.ref)
  expect(list.data).toHaveLength(grantees.length)
  list.data.forEach((element: string) => {
    expect(grantees.includes(element)).toBeTruthy()
  })

  // patch and upload
  const { publicKey } = await bee.getNodeAddresses()
  const filename = 'act-4.txt'
  const data = 'hello act grantees!'
  const uploadResult = await bee.uploadFile(batch(), data, filename, { act: true })

  await System.sleepMillis(Dates.seconds(4))

  const patchResponse = await bee.patchGrantees(batch(), createResponse.ref, uploadResult.historyAddress, patchGrantees)

  const listAfterPatch = await bee.getGrantees(patchResponse.ref)
  expect(listAfterPatch.data).toHaveLength(1)
  expect(listAfterPatch.data[0]).toBe(patchGrantees.add[0])

  const file = await bee.downloadFile(uploadResult.reference, filename, {
    headers: {
      'swarm-act': 'true',
      'swarm-act-publisher': publicKey.toCompressedHex(),
      'swarm-act-history-address': uploadResult.historyAddress,
      'swarm-act-timestamp': '1',
    },
  })
  expect(file.data.toUtf8()).toBe(data)
})
