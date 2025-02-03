import { Bee } from './bee'

export { MerkleTree } from 'cafe-utility'
export { MantarayNode } from './manifest/manifest'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './modules/debug/status'
export * from './types'
export { Bytes } from './utils/bytes'
export * from './utils/constants'
export * from './utils/error'
export * as Utils from './utils/expose'
export * from './utils/tokens'
export * from './utils/typed-bytes'
export { Bee }

// for require-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      Utils: typeof import('./utils/expose')
      BeeError: typeof import('./utils/error').BeeError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
      MantarayNode: typeof import('./manifest/manifest').MantarayNode
      MerkleTree: typeof import('cafe-utility').MerkleTree
      Reference: typeof import('./utils/typed-bytes').Reference
    }
  }
}
