import { Bee } from './bee'
import { BeeDebug } from './bee-debug'

export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './modules/debug/status'
export * from './types'
export * from './utils/error'
export * as Utils from './utils/expose'
export { Bee, BeeDebug }

// for require-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      BeeDebug: typeof import('./bee-debug').BeeDebug
      Utils: typeof import('./utils/expose')
      BeeError: typeof import('./utils/error').BeeError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
    }
  }
}
