import { BeeArgumentError } from './error'

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
    return false
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
