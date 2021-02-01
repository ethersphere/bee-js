/**
 * Compatibility functions for working with File API objects
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/File
 */

export function isFile(file: unknown): file is File {
  // browser
  if (typeof File === 'function') {
    return file instanceof File
  }

  // node.js
  const f = file as File

  return (
    typeof f === 'object' &&
    typeof f.name === 'string' &&
    (typeof f.stream === 'function' || typeof f.arrayBuffer === 'function')
  )
}

export function fileReadableStreamOrArrayBuffer(file: File): ReadableStream | Promise<ArrayBuffer> {
  if (file.stream) {
    return file.stream()
  }

  return fileArrayBuffer(file)
}

export function fileArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (file.arrayBuffer) {
    return file.arrayBuffer()
  }

  // workaround for Safari where arrayBuffer is not supported on Files
  return new Promise(resolve => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as ArrayBuffer)
    fr.readAsArrayBuffer(file)
  })
}
