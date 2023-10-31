import { AxiosRequestConfig, AxiosResponse } from 'axios'

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
    message: string,
    public status?: number,
    public config?: AxiosRequestConfig,
    public request?: any,
    public response?: AxiosResponse,
  ) {
    super(message)
  }
}
