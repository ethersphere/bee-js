export {} //indicate it is a module type declaration

declare global {
  interface Window {
    BeeJs: typeof import('../../src')
  }
}
