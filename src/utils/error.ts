export class BeeError extends Error {
  public constructor(message: string) {
    super(message)
  }
}

export class BeeRequestError extends BeeError {
  public constructor(message: string) {
    super(message)
  }
}

export class BeeResponseError extends BeeError {
  public constructor(readonly status: number, message: string) {
    super(message)
  }
}
