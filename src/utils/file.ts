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
    typeof (f as File).name === 'string' &&
    (typeof (f as File).stream === 'function' || typeof (f as File).arrayBuffer === 'function')
  )
}

/**
 * Compatibility helper for browsers where the `arrayBuffer function is
 * missing from `File` objects.
 *
 * @param file A File object
 */
export async function fileArrayBuffer(file: File): Promise<ArrayBuffer> {
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
