import { Bee } from './bee'
import { BeeDebug } from './bee-debug'

export * as Utils from './utils'
export * as Types from './types/index'
export { Bee, BeeDebug }

// for requrie-like imports
declare global {
  interface Window {
    // binded as 'BeeJs' via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      BeeDebug: typeof import('./bee-debug').BeeDebug
      Utils: typeof import('./utils')
    }
  }
}
