import { BZZ, DAI } from '../../src'

test('BZZ', () => {
  const bzz = BZZ.fromDecimalString('13.37')
  expect(bzz.toPLURString()).toBe('133700000000000000')
  expect(bzz.toPLURBigInt()).toBe(133700000000000000n)
  expect(bzz.toDecimalString()).toBe('13.3700000000000000')
  expect(BZZ.fromDecimalString('114.1695886699465624').toPLURBigInt()).toBe(1141695886699465624n)
  expect(BZZ.fromDecimalString('114.1695886699465624').toPLURString()).toBe('1141695886699465624')
})

test('DAI', () => {
  expect(DAI.fromWei('4596417133719887384').toDecimalString()).toBe('4.596417133719887384')
  expect(DAI.fromDecimalString('4.596417133719887384').toWeiBigInt()).toBe(4596417133719887384n)
  expect(DAI.fromDecimalString('4.596417133719887384').toWeiString()).toBe('4596417133719887384')
})

test('BZZ arithmetic', () => {
  const sent = BZZ.fromDecimalString('1.89')
  const received = BZZ.fromDecimalString('45.600000061124')
  expect(sent.plus('401100000000000000').minus(received).toDecimalString()).toBe('-3.6000000611240000')
})

test('DAI arithmetic', () => {
  const nativeTokenBalance = '4556337694217410844'
  const fees = '227889330863782959'
  const total = DAI.fromWei(nativeTokenBalance).minus(fees)
  expect(total.plus(DAI.fromDecimalString('1')).toDecimalString()).toBe('5.328448363353627885')
})
