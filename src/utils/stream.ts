import { Readable as NodeReadable } from 'stream'
import { isStrictlyObject } from './type'

/**
 * Validates if passed object is either browser's ReadableStream
 * or Node's Readable.
 *
 * @param entry
 */
export function isReadable(entry: unknown): entry is NodeReadable {
  if (!isStrictlyObject(entry)) {
    return false
  }

  const nodeReadable = entry as NodeReadable

  if (typeof nodeReadable.pipe === 'function' && nodeReadable.readable && typeof nodeReadable._read === 'function') {
    return true
  }

  const browserReadable = entry as ReadableStream

  if (
    typeof browserReadable.getReader === 'function' &&
    browserReadable.locked !== undefined &&
    typeof browserReadable.cancel === 'function' &&
    typeof browserReadable.pipeTo === 'function' &&
    typeof browserReadable.pipeThrough === 'function'
  ) {
    return true
  }

  return false
}

export function isReadableStream(entry: unknown): entry is ReadableStream {
  const browserReadable = entry as ReadableStream

  if (
    typeof browserReadable.getReader === 'function' &&
    browserReadable.locked !== undefined &&
    typeof browserReadable.cancel === 'function' &&
    typeof browserReadable.pipeTo === 'function' &&
    typeof browserReadable.pipeThrough === 'function'
  ) {
    return true
  }

  return false
}

export function isNodeReadable(entry: unknown): entry is NodeReadable {
  const nodeReadable = entry as NodeReadable

  if (typeof nodeReadable.pipe === 'function' && nodeReadable.readable && typeof nodeReadable._read === 'function') {
    return true
  }

  return false
}

export function normalizeStreamToReadableStream(stream: NodeReadable): ReadableStream {}
