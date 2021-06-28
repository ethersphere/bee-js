import fs from 'fs'
import path from 'path'
import { Collection } from '../types'
import { BeeArgumentError } from './error'
import { fileArrayBuffer } from './file'
import { isUint8Array } from './type'

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

/**
 * Creates array in the format of Collection with data loaded from directory on filesystem.
 * The function loads all the data into memory!
 *
 * @param dir path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection<Uint8Array>> {
  if (typeof dir !== 'string') {
    throw new TypeError('dir has to be string!')
  }

  if (dir === '') {
    throw new TypeError('dir must not be empty string!')
  }

  return buildCollectionRelative(dir, '')
}

async function buildCollectionRelative(dir: string, relativePath: string): Promise<Collection<Uint8Array>> {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const dirname = path.join(dir, relativePath)
  const entries = await fs.promises.opendir(dirname)
  let collection: Collection<Uint8Array> = []

  for await (const entry of entries) {
    const fullPath = path.join(dir, relativePath, entry.name)
    const entryPath = path.join(relativePath, entry.name)

    if (entry.isFile()) {
      collection.push({
        path: entryPath,
        data: new Uint8Array(await fs.promises.readFile(fullPath)),
      })
    } else if (entry.isDirectory()) {
      collection = [...(await buildCollectionRelative(dir, entryPath)), ...collection]
    }
  }

  return collection
}

/*
 * This is a workaround for fixing the type definitions
 * regarding the missing `webkitRelativePath` property which is
 * provided on files if you specify the `webkitdirectory`
 * property on the HTML input element. This is a non-standard
 * functionality supported in all major browsers.
 */
interface WebkitFile extends File {
  readonly webkitRelativePath?: string
}

function makeFilePath(file: WebkitFile) {
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
    const file = fileList[i] as WebkitFile

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
    const file = fileList[i] as WebkitFile

    if (file) {
      sum += file.size
    }
  }

  return sum
}

/**
 * Calculate folder size recursively
 *
 * @param dir the path to the folder to check
 * @returns size in bytes
 */
export async function getFolderSize(dir: string): Promise<number> {
  if (typeof dir !== 'string') {
    throw new TypeError('dir has to be string!')
  }

  if (dir === '') {
    throw new TypeError('dir must not be empty string!')
  }

  const entries = await fs.promises.opendir(dir)
  let size = 0

  for await (const entry of entries) {
    if (entry.isFile()) {
      const stats = await fs.promises.stat(path.join(dir, entry.name))
      size += stats.size
    } else if (entry.isDirectory()) {
      size += await getFolderSize(path.join(dir, entry.name))
    }
  }

  return size
}
