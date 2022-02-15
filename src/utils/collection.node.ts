import fs from 'fs'
import path from 'path'
import { Collection } from '../types/index.js'

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
