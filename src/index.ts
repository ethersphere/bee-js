import { Bee } from './bee'
import { BeeDebug } from './bee-debug'

export * as Utils from './utils/expose'
export * from './types'
export * from './utils/error'
export { SUPPORTED_BEE_VERSION, SUPPORTED_BEE_VERSION_EXACT } from './modules/debug/status'
export { Bee, BeeDebug }

// for requrie-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      BeeDebug: typeof import('./bee-debug').BeeDebug
      Utils: typeof import('./utils/expose')
      BeeError: typeof import('./utils/error').BeeError
      BeeRequestError: typeof import('./utils/error').BeeRequestError
      BeeResponseError: typeof import('./utils/error').BeeResponseError
      BeeArgumentError: typeof import('./utils/error').BeeArgumentError
    }
  }
}
