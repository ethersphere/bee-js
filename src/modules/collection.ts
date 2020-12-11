import type { Readable } from 'stream'
import * as fs from 'fs'
import path from 'path'

import type { UploadOptions, Collection, FileData, UploadHeaders } from '../types'
import { makeTar } from '../utils/tar'
import { safeAxios } from '../utils/safeAxios'
import { extractUploadHeaders, readFileHeaders } from '../utils/headers'
import { isReadable } from '../utils/readable'
import { BeeArgumentError } from '../utils/error'

const dirsEndpoint = '/dirs'
const bzzEndpoint = '/bzz'

interface CollectionUploadHeaders extends UploadHeaders {
  'swarm-index-document'?: string
  'swarm-error-document'?: string
}

export interface CollectionUploadOptions extends UploadOptions {
  indexDocument?: string
  errorDocument?: string
}

function extractCollectionUploadHeaders(options?: CollectionUploadOptions): CollectionUploadHeaders {
  const headers: CollectionUploadHeaders = extractUploadHeaders(options)

  if (options?.indexDocument) headers['swarm-index-document'] = options.indexDocument

  if (options?.errorDocument) headers['swarm-error-document'] = options.errorDocument

  return headers
}

function isUint8Array(obj: unknown): obj is Uint8Array {
  return obj instanceof Uint8Array
}

function isCollection(data: unknown): data is Collection<Uint8Array | Readable> {
  if (!Array.isArray(data)) {
    return false
  }

  return !data.some(
    entry =>
      typeof entry !== 'object' || !entry.data || !entry.path || !(isUint8Array(entry.data) || isReadable(entry.data)),
  )
}

/**
 * Creates array in the format of Collection with Readable streams prepared for upload.
 *
 * @param dir absolute path to the directory
 * @param recursive flag that specifies if the directory should be recursively walked and get files in those directories.
 */
export async function buildCollection(dir: string, recursive = true): Promise<Collection<Readable>> {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const entries = await fs.promises.opendir(dir)
  let collection: Collection<Readable> = []

  for await (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isFile()) {
      collection.push({
        path: fullPath,
        size: (await fs.promises.stat(fullPath)).size,
        data: fs.createReadStream(fullPath),
      })
    } else if (entry.isDirectory() && recursive) {
      collection = [...(await buildCollection(fullPath, recursive)), ...collection]
    }
  }

  return collection
}

function fileArrayBuffer(file: any) {
  if (file.arrayBuffer) {
    return file.arrayBuffer()
  }
  // workaround for Safari where arrayBuffer is not supported on Files
  return new Promise((resolve) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.readAsArrayBuffer(file)
  })
}

interface WebkitFile extends File {
  webkitRelativePath?: string
}

function filePath(file: WebkitFile)  {
  if (file.webkitRelativePath && file.webkitRelativePath !== '') {
    return file.webkitRelativePath.replace(/.*?\//i, '')
  }
  return file.name
}

export async function buildFileListCollection(fileList: FileList | File[]): Promise<Collection<Uint8Array>> {
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

  console.debug('buildFileListCollection', {collection})
  return collection
}

/**
 * Upload collection of files to a Bee node
 *
 * @param url     Bee URL
 * @param data    Data in Collection format to be uploaded
 * @param options Additional options like tag, encryption, pinning
 */
export async function upload(
  url: string,
  data: Collection<Uint8Array>,
  options?: CollectionUploadOptions,
): Promise<string> {
  if (!url || url === '') {
    throw new BeeArgumentError('url parameter is required and cannot be empty', url)
  }

  if (!isCollection(data)) {
    throw new BeeArgumentError('invalid collection', data)
  }

  const tarData = await makeTar(data)

  const response = await safeAxios<{ reference: string }>({
    method: 'post',
    url: `${url}${dirsEndpoint}`,
    data: tarData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      ...extractCollectionUploadHeaders(options),
    },
  })

  return response.data.reference
}

/**
 * Download single file as a buffer from Collection given using the path
 *
 * @param url  Bee URL
 * @param hash Bee Collection hash
 * @param path Path of the requested file in the Collection
 */
export async function download(url: string, hash: string, path = ''): Promise<FileData<Uint8Array>> {
  if (!url || url === '') {
    throw new BeeArgumentError('url parameter is required and cannot be empty', url)
  }

  const response = await safeAxios<ArrayBuffer>({
    responseType: 'arraybuffer',
    url: `${url}${bzzEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: new Uint8Array(response.data),
  }

  return file
}

/**
 * Download single file as a buffer from Collection given using the path
 *
 * @param url  Bee URL
 * @param hash Bee Collection hash
 * @param path Path of the requested file in the Collection
 */
export async function downloadReadable(url: string, hash: string, path = ''): Promise<FileData<Readable>> {
  if (!url || url === '') {
    throw new BeeArgumentError('url parameter is required and cannot be empty', url)
  }

  const response = await safeAxios<Readable>({
    responseType: 'stream',
    url: `${url}${bzzEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: response.data,
  }

  return file
}
