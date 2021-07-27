import fs from 'fs'
import path from 'path'
import { Collection, Readable } from '../types'
import { Readable as NodeReadable } from 'stream'

/**
 * Creates array in the format of Collection with data loaded from directory on filesystem.
 * The function loads all the data into memory!
 *
 * @param dir path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection<NodeReadable>> {
  if (typeof dir !== 'string') {
    throw new TypeError('dir has to be string!')
  }

  if (dir === '') {
    throw new TypeError('dir must not be empty string!')
  }

  return buildCollectionRelative(dir, '')
}

async function buildCollectionRelative(dir: string, relativePath: string): Promise<Collection<NodeReadable>> {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const dirname = path.join(dir, relativePath)
  const entries = await fs.promises.opendir(dirname)
  let collection: Collection<NodeReadable> = []

  for await (const entry of entries) {
    const fullPath = path.join(dir, relativePath, entry.name)
    const entryPath = path.join(relativePath, entry.name)

    if (entry.isFile()) {
      collection.push({
        path: entryPath,
        data: fs.createReadStream(fullPath),
        length: (await fs.promises.stat(fullPath)).size,
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

export function makeCollectionFromFileList(fileList: FileList | File[]): Collection<Readable> {
  const collection: Collection<Readable> = []

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i] as WebkitFile

    if (file) {
      collection.push({
        path: makeFilePath(file),
        data: file.stream(),
        length: file.size,
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
