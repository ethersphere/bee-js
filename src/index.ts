import { Bee } from './bee'
import { BeeDebug } from './bee-debug'

export { Bee, BeeDebug }

// for requrie-like imports
declare global {
  interface Window {
    // binded like BeeJs via Webpack
    BeeJs: {
      Bee: typeof import('./bee').Bee
      BeeDebug: typeof import('./bee-debug').BeeDebug
    }
  }
}
