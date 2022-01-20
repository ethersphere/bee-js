export class BeeError extends Error {
  public constructor(message: string) {
    super(message)
  }
}

export class BeeArgumentError extends BeeError {
  public constructor(message: string, readonly value: unknown) {
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

export class BeeNotAJsonError extends BeeError {
  public constructor() {
    super(`Received response is not valid JSON.`)
  }
}
