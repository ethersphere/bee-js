import { Strings } from 'cafe-utility'
import { PrivateKey } from '../../src'

test('Signature.isValid', () => {
  const privateKey = new PrivateKey(Strings.randomHex(64))
  const digest = 'I will sign this'
  const signature = privateKey.sign(digest)

  expect(signature.isValid(digest, privateKey.publicKey().address())).toBe(true)

  expect(signature.isValid(digest, new PrivateKey(Strings.randomHex(64)).publicKey().address())).toBe(false)
  expect(signature.isValid('This is not the signed message!', privateKey.publicKey().address())).toBe(false)
})
