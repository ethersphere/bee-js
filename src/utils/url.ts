import { BAD_PORTS } from './bad-ports'
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
 * Validates that passed string is valid port to use Bee and is not a bad port.
 * We support only HTTP and HTTPS protocols. Bad ports are defined in
 * the WHATWG Fetch spec (https://fetch.spec.whatwg.org/#port-blocking)
 * and are blocked for HTTP/HTTPS requests.
 *
 * @param port
 */

export function isValidBeePort(port: unknown): port is string {
  if (typeof port !== 'string') {
    return false
  }

  if (BAD_PORTS.includes(port)) {
    return false
  }

  const portNumber = parseInt(port, 10)

  return portNumber > 0 && portNumber < 65536 && !isNaN(portNumber)
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

  const port = new URL(url as unknown as string).port

  if (port && !isValidBeePort(port)) {
    throw new BeeArgumentError('Port in URL is considered bad port and cannot be used!', port)
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
