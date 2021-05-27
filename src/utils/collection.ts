import { Collection } from '../types'
import { BeeArgumentError } from './error'
import path from 'path'
import fs from 'fs'
import { fileArrayBuffer } from './file'

function isUint8Array(obj: unknown): obj is Uint8Array {
  return obj instanceof Uint8Array
}

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
 * @param dir absolute path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection<Uint8Array>> {
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

function filePath(file: WebkitFile) {
  if (file.webkitRelativePath && file.webkitRelativePath !== '') {
    return file.webkitRelativePath.replace(/.*?\//i, '')
  }

  return file.name
}

export async function makeCollectionFromFileList(fileList: FileList | File[]): Promise<Collection<Uint8Array>> {
  const collection: Collection<Uint8Array> = []

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i] as WebkitFile

    if (file) {
      collection.push({
        path: filePath(file),
        data: new Uint8Array(await fileArrayBuffer(file)),
      })
    }
  }

  return collection
}
