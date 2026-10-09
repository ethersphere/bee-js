export class BeeError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'BeeError'
  }
}

export class BeeArgumentError extends BeeError {
  public constructor(
    message: string,
    readonly value: unknown,
  ) {
    super(message)
    this.name = 'BeeArgumentError'
  }
}

export class BeeResponseError extends BeeError {
  public readonly response: { status: number | undefined; data: unknown; statusText: string | undefined }

  public constructor(
    public method: string,
    public url: string,
    message: string,
    public responseBody?: unknown,
    public status?: number,
    public statusText?: string,
  ) {
    super(message)
    this.name = 'BeeResponseError'
    this.response = { status, data: responseBody, statusText }
  }
}
