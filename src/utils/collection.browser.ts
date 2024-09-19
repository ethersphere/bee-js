import { Collection } from '../types'

/**
 * Creates array in the format of Collection with data loaded from directory on filesystem.
 * The function loads all the data into memory!
 *
 * @param dir path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection> {
  throw new Error('Creating Collection from File System is not supported in browsers!')
}

/**
 * Calculate folder size recursively
 *
 * @param dir the path to the folder to check
 * @returns size in bytes
 */
export async function getFolderSize(dir: string): Promise<number> {
  throw new Error('Creating Collection from File System is not supported in browsers!')
}
