import chai from 'chai'

import * as Collection from '../../src/modules/collection'
import { createReadable } from '../utils'
import { CollectionContainer } from '../../src'
import { Readable } from 'stream'

const { expect } = chai

const BEE_URL = process.env.BEE_URL || 'http://bee-0.localhost'

describe('modules/collection', () => {
  it('should store and retrieve directory', async () => {
    const dir: CollectionContainer<Buffer> = [
      {
        path: 'file1.txt',
        data: Buffer.from('hello world')
      },
      {
        path: 'file2.txt',
        data: Buffer.from('hello other world')
      },
      {
        path: 'dir/and/file3.txt',
        data: Buffer.from('hello future world')
      }
    ]

    const hash = await Collection.upload(BEE_URL, dir)

    const file1 = await Collection.download(BEE_URL, hash, 'file1.txt')
    expect(file1.toString()).to.equal('hello world')

    const file2 = await Collection.download(BEE_URL, hash, 'file2.txt')
    expect(file2.toString()).to.equal('hello other world')

    const file3 = await Collection.download(BEE_URL, hash, 'dir/and/file3.txt')
    expect(file3.toString()).to.equal('hello future world')
  })

  it('should store directories with readable', async () => {
    const dir: CollectionContainer<Readable> = [
      {
        path: 'file1.txt',
        size: 11,
        data: createReadable('hello world')
      },
      {
        path: 'file2.txt',
        size: 17,
        data: createReadable('hello other world')
      },
      {
        path: 'dir/and/file3.txt',
        size: 18,
        data: createReadable('hello future world')
      }
    ]

    const hash = await Collection.upload(BEE_URL, dir)

    const file1 = await Collection.download(BEE_URL, hash, 'file1.txt')
    expect(file1.toString()).to.equal('hello world')

    const file2 = await Collection.download(BEE_URL, hash, 'file2.txt')
    expect(file2.toString()).to.equal('hello other world')

    const file3 = await Collection.download(BEE_URL, hash, 'dir/and/file3.txt')
    expect(file3.toString()).to.equal('hello future world')
  })

  it('should fail if readable directory does not have specified size', async () => {
    const dir: CollectionContainer<Readable> = [
      {
        path: 'file1.txt',
        data: createReadable('hello world')
      }
    ]

    try {
      await Collection.upload(BEE_URL, dir)
      expect.fail('Should have raise exception!')
    } catch (e) {
      expect(e.message).to.include('Size has to be specified for Readable data')
    }
  })
})
