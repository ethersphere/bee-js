import { Strings, Types } from 'cafe-utility'
import { Bee, BeeDev } from '../src'

export function makeBee() {
  if (currentBeeMode() === 'dev') {
    return new BeeDev('http://localhost:1633')
  }

  return new Bee(selectBeeUrl())
}

export function batch() {
  if (currentBeeMode() === 'light') {
    return Types.asString(process.env.JEST_LIGHT_BATCH_ID)
  }

  if (currentBeeMode() === 'full') {
    return Types.asString(process.env.JEST_FULL_BATCH_ID)
  }

  if (currentBeeMode() === 'dev') {
    return '29c91093cbbdaa1a126d2a24c3ee2c70e7c36c7653ba156829a06d07a9ccc4a4'
  }
  throw Error('Batch ID not available in ultra-light mode')
}

export function currentBeeMode(): 'full' | 'light' | 'ultra-light' | 'dev' {
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

export function arbitraryPrivateKey() {
  return Strings.randomHex(64)
}
