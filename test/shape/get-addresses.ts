import { Types } from 'cafe-utility'

export const getAddressesShape = {
  overlay: Types.isHexString,
  underlay: (x: any) =>
    Types.asArray(x)
      .map(Types.isString)
      .every((y: boolean) => y === true),
  ethereum: Types.isHexString,
  publicKey: Types.isHexString,
  pssPublicKey: Types.isHexString,
}
