import { BeeArgumentError } from './error.js'
import { isObject } from './type.js'

interface NodeJsError {
  code: string
}

function isNodeJsError(e: unknown): e is NodeJsError {
  return isObject(e) && typeof e.code === 'string'
}

/**
 * Validates that passed string is valid URL of Bee.
 * We support only HTTP and HTTPS protocols.
 *
 * @param url
 */
export function isValidBeeUrl(url: unknown): url is URL {
  try {
    if (typeof url !== 'string') {
      return false
    }

    const urlObject = new URL(url)

    // There can be wide range of protocols passed.
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:'
  } catch (e) {
    // URL constructor throws TypeError if not valid URL
    // TODO: Drop the `.code` hack for NodeJS environment: https://github.com/ethersphere/bee-js/issues/204
    if (e instanceof TypeError || (isNodeJsError(e) && e.code === 'ERR_INVALID_URL')) {
      return false
    }

    throw e
  }
}

/**
 * Validates that passed string is valid URL of Bee, if not it throws BeeArgumentError.
 * We support only HTTP and HTTPS protocols.
 * @param url
 * @throws BeeArgumentError if non valid URL
 */
export function assertBeeUrl(url: unknown): asserts url is URL {
  if (!isValidBeeUrl(url)) {
    throw new BeeArgumentError('URL is not valid!', url)
  }
}

/**
 * Removes trailing slash out of the given string.
 * @param url
 */
export function stripLastSlash(url: string): string {
  if (url.endsWith('/')) {
    return url.slice(0, -1)
  }

  return url
}
