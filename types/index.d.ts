export {} //indicate it is a module type declaration

declare global {
  interface Window {
    BeeJs: typeof import('../src')
  }
  namespace jest {
    interface Matchers<R> {
      toBeHashReference(): R
      toBeBeeResponse(statusCode: number): R
    }
  }
}
