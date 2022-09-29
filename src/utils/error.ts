import type { KyRequestOptions } from '../types'

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
  /**
   * @param message
   * @param requestOptions KyOptions that were used to assemble the request. THIS MIGHT NOT BE COMPLETE! If custom Ky instance was used that has set defaults then these defaults are not visible in this object!
   */
  public constructor(message: string, readonly requestOptions: KyRequestOptions) {
    super(message)
  }
}

export class BeeResponseError extends BeeError {
  /**
   * @param status HTTP status code number
   * @param response Response returned from the server
   * @param responseBody Response body as string which is returned from response.text() call
   * @param requestOptions KyOptions that were used to assemble the request. THIS MIGHT NOT BE COMPLETE! If custom Ky instance was used that has set defaults then these defaults are not visible in this object!
   * @param message
   */
  public constructor(
    readonly status: number,
    readonly response: Response,
    readonly responseBody: string,
    readonly requestOptions: KyRequestOptions,
    message: string,
  ) {
    super(message)
  }
}

export class BeeNotAJsonError extends BeeError {
  public constructor() {
    super(`Received response is not valid JSON.`)
  }
}
