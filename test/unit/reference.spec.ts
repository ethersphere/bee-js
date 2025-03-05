import { Strings } from 'cafe-utility'
import { Reference } from '../../src'

test('Reference.isValid', () => {
  expect(Reference.isValid(Strings.randomHex(64))).toBeTruthy()
  expect(Reference.isValid(Strings.randomHex(128))).toBeTruthy()

  expect(Reference.isValid('0x' + Strings.randomHex(64))).toBeTruthy()
  expect(Reference.isValid('0x' + Strings.randomHex(128))).toBeTruthy()

  expect(Reference.isValid(Strings.randomHex(64))).toBeTruthy()
  expect(Reference.isValid(Strings.randomHex(128))).toBeTruthy()

  expect(Reference.isValid('0X' + Strings.randomHex(64).toUpperCase())).toBeTruthy()
  expect(Reference.isValid('0X' + Strings.randomHex(128).toUpperCase())).toBeTruthy()

  expect(Reference.isValid(Strings.randomHex(63))).toBeFalsy()
  expect(Reference.isValid(Strings.randomHex(65))).toBeFalsy()
  expect(Reference.isValid(Strings.randomHex(127))).toBeFalsy()
  expect(Reference.isValid(Strings.randomHex(129))).toBeFalsy()

  expect(Reference.isValid('0x' + Strings.randomHex(63))).toBeFalsy()
  expect(Reference.isValid('0x' + Strings.randomHex(65))).toBeFalsy()
  expect(Reference.isValid('0x' + Strings.randomHex(127))).toBeFalsy()
  expect(Reference.isValid('0x' + Strings.randomHex(129))).toBeFalsy()
})
