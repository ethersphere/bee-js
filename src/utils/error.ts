export class BeeError extends Error {
  public constructor (message: string) {
    super(message)
  }
}

export class BeeHTTPError extends BeeError {
  public constructor (readonly status: number, message: string) {
    super(message)
  }
}
