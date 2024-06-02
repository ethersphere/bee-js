import { Collection } from '../types'
import { BeeArgumentError } from './error'

export function isCollection(data: unknown): data is Collection {
  if (!Array.isArray(data)) {
    return false
  }

  return data.every(entry => typeof entry === 'object' && entry.path && entry.size)
}

export function assertCollection(data: unknown): asserts data is Collection {
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

export async function makeCollectionFromFileList(fileList: FileList | File[]): Promise<Collection> {
  return Array.from(fileList).map(file => ({
    path: makeFilePath(file),
    size: file.size,
    file,
  }))
}

/**
 * Calculate cumulative size of files
 *
 * @param fileList list of files to check
 * @returns size in bytes
 */
export function getCollectionSize(fileList: FileList | File[]): number {
  return Array.from(fileList).reduce((sum, file) => sum + file.size, 0)
}
