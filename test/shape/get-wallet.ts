import { Types } from 'cafe-utility'

export const getWalletShape = {
  bzzBalance: Types.isIntegerString,
  nativeTokenBalance: Types.isIntegerString,
  chainID: Types.isNumber,
  chequebookContractAddress: Types.isHexString,
  walletAddress: Types.isHexString,
}
