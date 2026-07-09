import { batch, makeBee } from '../utils'

const bee = makeBee()

test('CRUD pins', async () => {
  const response = await bee.upload.data(batch(), 'Pinned hello.', { pin: true })
  const pins = await bee.pin.getAll()
  expect(pins.some(x => x.toHex() === response.reference.toHex())).toBe(true)

  const pin = await bee.pin.get(response.reference)
  expect(pin.reference.toHex()).toBe(response.reference.toHex())

  await bee.pin.reuploadData(batch(), response.reference) // push to network
  expect(await bee.download.isRetrievable(response.reference)).toBe(true)

  await bee.pin.remove(response.reference)
  const pinsAfterUnpin = await bee.pin.getAll()
  expect(pinsAfterUnpin.some(x => x.toHex() === response.reference.toHex())).toBe(false)

  await bee.pin.add(response.reference)
  const pinsAfterPin = await bee.pin.getAll()
  expect(pinsAfterPin.some(x => x.toHex() === response.reference.toHex())).toBe(true)

  await bee.pin.remove(response.reference)
  const pinsAfterUnpin2 = await bee.pin.getAll()
  expect(pinsAfterUnpin2.some(x => x.toHex() === response.reference.toHex())).toBe(false)
})
