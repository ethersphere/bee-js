function isObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }

  if ((value as { _readableState?: unknown })._readableState !== undefined) {
    return false
  }

  const constructor = (value as { constructor?: { name?: string; isBuffer?: unknown } }).constructor

  if (constructor?.isBuffer) {
    return false
  }

  return !['AbortController', 'AbortSignal', 'Uint8Array', 'ArrayBuffer', 'ReadableStream'].includes(
    constructor?.name ?? '',
  )
}

function isStrictlyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value)
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

function deepMergeInPlace(target: unknown, source: unknown): void {
  if (!isStrictlyObject(target) || !isStrictlyObject(source)) {
    return
  }

  for (const [key, value] of Object.entries(source)) {
    if (isStrictlyObject(value)) {
      if (!target[key]) {
        target[key] = {}
      }
      deepMergeInPlace(target[key], value)
    } else if (Array.isArray(value)) {
      target[key] = [...value]
    } else if (!isNullish(value) || isNullish(target[key])) {
      target[key] = value
    }
  }
}

export function deepMerge2<X extends object, Y extends object>(a: X, b: Y): X & Y {
  const target = {}
  deepMergeInPlace(target, a)
  deepMergeInPlace(target, b)

  return target as X & Y
}

export function deepMerge3<X extends object, Y extends object, Z extends object>(a: X, b: Y, c: Z): X & Y & Z {
  const target = {}
  deepMergeInPlace(target, a)
  deepMergeInPlace(target, b)
  deepMergeInPlace(target, c)

  return target as X & Y & Z
}

export function getDeep(object: unknown, path: string): unknown {
  let current = object

  for (const key of path.split('.')) {
    if (isNullish(current)) {
      return null
    }
    current = (current as Record<string, unknown>)[key]
  }

  return isNullish(current) ? null : current
}
