export {} //indicate it is a module type declaration

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeHashReference(): R
      toBeBeeResponse(expectedStatusCode: number): R
      toBeOneOf(el: unknown[]): R
      toBeType(type: string): R
      toBeNumberString(): R
    }
  }
}
