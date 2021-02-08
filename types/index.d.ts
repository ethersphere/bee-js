export {} //indicate it is a module type declaration

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeHashReference(): R
      toBeBeeResponse(statusCode: number): R
    }
  }
}
