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

export class BeeResponseError extends BeeError {
  public constructor(
    public method: string,
    public url: string,
    message: string,
    public responseBody?: any,
    public status?: number,
    public statusText?: string,
  ) {
    super(message)
  }
}
