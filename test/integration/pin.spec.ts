import { batch, makeBee } from '../utils'

const bee = makeBee()

test('CRUD pins', async () => {
  const response = await bee.uploadData(batch(), 'Pinned hello.', { pin: true })
  const pins = await bee.getAllPins()
  expect(pins.some(x => x.toHex() === response.reference.toHex())).toBe(true)

  const pin = await bee.getPin(response.reference)
  expect(pin.reference.toHex()).toBe(response.reference.toHex())

  expect(await bee.isReferenceRetrievable(response.reference)).toBe(true)
  await bee.reuploadPinnedData(batch(), response.reference) // does not throw

  await bee.unpin(response.reference)
  const pinsAfterUnpin = await bee.getAllPins()
  expect(pinsAfterUnpin.some(x => x.toHex() === response.reference.toHex())).toBe(false)

  await bee.pin(response.reference)
  const pinsAfterPin = await bee.getAllPins()
  expect(pinsAfterPin.some(x => x.toHex() === response.reference.toHex())).toBe(true)

  await bee.unpin(response.reference)
  const pinsAfterUnpin2 = await bee.getAllPins()
  expect(pinsAfterUnpin2.some(x => x.toHex() === response.reference.toHex())).toBe(false)
})
