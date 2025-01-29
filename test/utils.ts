import { Strings, Types } from 'cafe-utility'
import { Bee } from '../src'

export function makeBee() {
  return new Bee(selectBeeUrl(), {
    headers: {
      authorization: Types.asString(process.env.JEST_BEE_SECRET),
    },
  })
}

export function batch() {
  if (currentBeeMode() === 'light') {
    return Types.asString(process.env.JEST_LIGHT_BATCH_ID)
  }

  if (currentBeeMode() === 'full') {
    return Types.asString(process.env.JEST_FULL_BATCH_ID)
  }
  throw Error('Batch ID not available in ultra-light mode')
}

export function currentBeeMode(): 'full' | 'light' | 'ultra-light' {
  return 'full'
}

function selectBeeUrl() {
  switch (currentBeeMode()) {
    case 'full':
      return Types.asString(process.env.JEST_BEE_FULL_URL)
    case 'light':
      return Types.asString(process.env.JEST_BEE_LIGHT_URL)
    case 'ultra-light':
      return Types.asString(process.env.JEST_BEE_ULTRA_LIGHT_URL)
    default:
      throw Error('Invalid mode')
  }
}

export function arbitraryReference() {
  return Strings.randomHex(64)
}
