import { BeeArgumentError } from './error.js'
import { fileArrayBuffer } from './file.js'
import { isUint8Array } from './type.js'

import type { Collection } from '../types/index.js'

export function isCollection(data: unknown): data is Collection<Uint8Array> {
  if (!Array.isArray(data)) {
    return false
  }

  return data.every(entry => typeof entry === 'object' && entry.data && entry.path && isUint8Array(entry.data))
}

export function assertCollection(data: unknown): asserts data is Collection<Uint8Array> {
  if (!isCollection(data)) {
    throw new BeeArgumentError('invalid collection', data)
  }
}

function makeFilePath(file: File) {
  if (file.webkitRelativePath && file.webkitRelativePath !== '') {
    return file.webkitRelativePath.replace(/.*?\//i, '')
  }

  if (file.name) {
    return file.name
  }

  throw new TypeError('file is not valid File object')
}

export async function makeCollectionFromFileList(fileList: FileList | File[]): Promise<Collection<Uint8Array>> {
  const collection: Collection<Uint8Array> = []

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]

    if (file) {
      collection.push({
        path: makeFilePath(file),
        data: new Uint8Array(await fileArrayBuffer(file)),
      })
    }
  }

  return collection
}

/**
 * Calculate cumulative size of files
 *
 * @param fileList list of files to check
 * @returns size in bytes
 */
export function getCollectionSize(fileList: FileList | File[]): number {
  let sum = 0

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]

    if (file) {
      sum += file.size
    }
  }

  return sum
}
