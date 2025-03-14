import { Dates, Strings, System } from 'cafe-utility'
import { PublicKey } from '../../src'
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
  expect(list.grantees).toHaveLength(grantees.length)
  list.grantees.forEach((grantee: PublicKey) => {
    expect(grantees.some(x => x === grantee.toCompressedHex())).toBeTruthy()
  })

  // patch and upload
  const { publicKey } = await bee.getNodeAddresses()
  const filename = 'act-4.txt'
  const data = 'hello act grantees!'
  const uploadResult = await bee.uploadFile(batch(), data, filename, { act: true })

  await System.sleepMillis(Dates.seconds(5))

  const patchResponse = await bee.patchGrantees(
    batch(),
    createResponse.ref,
    uploadResult.historyAddress.getOrThrow(),
    patchGrantees,
  )

  const listAfterPatch = await bee.getGrantees(patchResponse.ref)
  expect(listAfterPatch.grantees).toHaveLength(1)
  expect(listAfterPatch.grantees[0].toCompressedHex()).toBe(patchGrantees.add[0])

  const file = await bee.downloadFile(uploadResult.reference, filename, {
    actPublisher: publicKey,
    actHistoryAddress: uploadResult.historyAddress.getOrThrow(),
    actTimestamp: 1,
  })
  expect(file.data.toUtf8()).toBe(data)
})

test('ACT upload history address', async () => {
  const bee = makeBee()
  const data = Strings.randomHex(2000)

  const upload = await bee.uploadFile(batch(), data, 'README.md')

  const actUpload1 = await bee.uploadFile(batch(), data, 'README.md', { act: true })
  const actUploadAgain1 = await bee.uploadFile(batch(), data, 'README.md', {
    act: true,
    actHistoryAddress: actUpload1.historyAddress.getOrThrow(),
  })

  const actUpload2 = await bee.uploadFile(batch(), data, 'README.md', { act: true })
  const actUploadAgain2 = await bee.uploadFile(batch(), data, 'README.md', {
    act: true,
    actHistoryAddress: actUpload2.historyAddress.getOrThrow(),
  })

  expect(upload.reference.toHex()).not.toBe(actUpload1.reference.toHex())
  expect(upload.reference.toHex()).not.toBe(actUpload2.reference.toHex())
  expect(actUpload1.reference.toHex()).not.toBe(actUpload2.reference.toHex())

  expect(actUpload1.historyAddress.getOrThrow().toHex()).toBe(actUploadAgain1.historyAddress.getOrThrow().toHex())
  expect(actUpload2.historyAddress.getOrThrow().toHex()).toBe(actUploadAgain2.historyAddress.getOrThrow().toHex())

  expect(actUpload1.historyAddress.getOrThrow().toHex()).not.toBe(actUpload2.historyAddress.getOrThrow().toHex())
  expect(actUploadAgain1.historyAddress.getOrThrow().toHex()).not.toBe(
    actUploadAgain2.historyAddress.getOrThrow().toHex(),
  )

  expect(actUpload1.reference.toHex()).toBe(actUploadAgain1.reference.toHex())
  expect(actUpload2.reference.toHex()).toBe(actUploadAgain2.reference.toHex())
})
