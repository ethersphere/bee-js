import { Readable } from 'stream'
import * as file from './modules/file'
import * as tag from './modules/tag'
import { OptionsUpload, Tag } from './types'

type Reference = string

/**
 * The Bee class provides a way of interacting with the Bee APIs based on the provided url
 *
 * @param url URL of a running Bee node
 */
export default class Bee {
  constructor(readonly url: string) {}

  uploadFile(data: string | Uint8Array | Readable, name?: string, options?: OptionsUpload): Promise<Reference> {
    return file.upload(this.url, data, name, options)
  }

  downloadFile(reference: Reference): Promise<file.File<Uint8Array>> {
    return file.download(this.url, reference)
  }

  downloadFileReadable(reference: Reference): Promise<file.File<Readable>> {
    return file.downloadReadable(this.url, reference)
  }

  createTag(): Promise<Tag> {
    return tag.createTag(this.url)
  }

  retrieveTag(tagUid: number | Tag): Promise<Tag> {
    return tag.retrieveTag(this.url, tagUid)
  }
}
