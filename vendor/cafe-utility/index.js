// Subset of cafe-utility@34.0.0 (MIT) used by tests and repo scripts.
'use strict'

const HEX_ALPHABET = '0123456789abcdef'
const ALPHANUMERIC_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomString(alphabet, length) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function joinUrl(parts) {
  const nonEmpty = parts.filter(part => part)
  let protocol = ''

  if (nonEmpty[0] && nonEmpty[0].includes('://')) {
    const separator = nonEmpty[0].indexOf('://')
    protocol = nonEmpty[0].slice(0, separator)
    nonEmpty[0] = nonEmpty[0].slice(separator + 3)
  }

  const segments = []

  for (const segment of nonEmpty.flatMap(part => String(part).split('/')).filter(part => part !== '.')) {
    if (segment !== '..') {
      segments.push(segment)
    } else if (!protocol || segments.length > 1) {
      segments.pop()
    }
  }

  return (protocol ? `${protocol}://` : '') + segments.join('/').replace(/\/{2,}/g, '/')
}

function findClosing(string, start, opening, closing) {
  let depth = 1

  for (let i = start; i < string.length; i++) {
    if (string.startsWith(closing, i)) {
      depth--

      if (depth === 0) {
        return i
      }
    } else if (string.startsWith(opening, i)) {
      depth++
    }
  }

  return -1
}

function extractAllBlocks(string, { opening, closing }) {
  const blocks = []
  let start = string.indexOf(opening)

  while (start !== -1) {
    const end = findClosing(string, start + opening.length, opening, closing)

    if (end === -1) {
      break
    }
    const block = string.slice(start, end + closing.length)
    blocks.push(block)
    start = string.indexOf(opening, start + block.length)
  }

  return blocks
}

const Strings = {
  randomHex: length => randomString(HEX_ALPHABET, length),
  randomAlphanumeric: length => randomString(ALPHANUMERIC_ALPHABET, length),
  joinUrl,
  extractAllBlocks,
}

const Dates = {
  seconds: count => count * 1000,
  minutes: count => count * 60_000,
  days: count => count * 86_400_000,
}

const Random = {
  intBetween: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
}

function sortAny(value) {
  if (Array.isArray(value)) {
    return value.map(sortAny).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map(key => [key, sortAny(value[key])]),
    )
  }

  return value
}

const Objects = {
  deepEquals: (a, b) => JSON.stringify(sortAny(a)) === JSON.stringify(sortAny(b)),
}

function describeName(options) {
  return options && options.name ? ` for ${options.name}` : ''
}

function asString(value, options) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`Expected string${describeName(options)}, got: ${value}`)
  }

  return value
}

function asHexString(value, options) {
  if (typeof value !== 'string' || !/^(0x)?[0-9a-f]+$/i.test(value)) {
    throw new TypeError(`Expected hex string${describeName(options)}, got: ${value}`)
  }
  const digits = value.replace(/^0x/i, '')

  if (digits.length % 2 !== 0) {
    throw new RangeError(`Expected even number of hex digits${describeName(options)}; got: ${value}`)
  }

  if (options && options.byteLength && digits.length !== options.byteLength * 2) {
    throw new RangeError(
      `Expected hex string${describeName(options)} of byte length ${options.byteLength}; got: ${digits}`,
    )
  }

  return `0x${digits}`
}

function asObject(value, options) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Expected object${describeName(options)}, got: ${value}`)
  }

  return value
}

const Types = { asString, asHexString, asObject }

async function sleepMillis(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

async function waitFor(predicate, options) {
  let passes = 0

  for (let attempt = 0; attempt < options.attempts; attempt++) {
    try {
      passes = (await predicate()) ? passes + 1 : 0
    } catch {
      passes = 0
    }

    if (passes >= (options.requiredConsecutivePasses || 1)) {
      return
    }

    if (attempt < options.attempts - 1) {
      await sleepMillis(options.waitMillis)
    }
  }

  throw new Error('Timed out waiting for predicate')
}

async function withRetries(callable, allowedFailures, delayMillisFirst, delayMillisLast) {
  let lastError

  for (let attempt = 0; attempt <= allowedFailures; attempt++) {
    try {
      return await callable()
    } catch (error) {
      lastError = error

      if (attempt === allowedFailures) {
        break
      }
      const progress = attempt / (allowedFailures - 1)
      await sleepMillis(delayMillisFirst + (delayMillisLast - delayMillisFirst) * progress)
    }
  }

  throw lastError
}

const System = { sleepMillis, waitFor, withRetries }

module.exports = { Dates, Objects, Random, Strings, System, Types }
