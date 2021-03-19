import * as collection from '../../src/modules/collection'
import { Collection, ENCRYPTED_REFERENCE_HEX_LENGTH } from '../../src/types'
import { beeUrl } from '../utils'

const BEE_URL = beeUrl()

describe('modules/collection', () => {
  it('should store and retrieve collection with single file', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure)
    const file = await collection.download(BEE_URL, hash, directoryStructure[0].path)

    expect(file.name).toEqual(directoryStructure[0].path)
    expect(file.data).toEqual(directoryStructure[0].data)
  })

  it('should retrieve the filename but not the complete path', async () => {
    const path = 'a/b/c/d/'
    const name = '0'
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: `${path}${name}`,
        data: Uint8Array.from([0]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure)
    const file = await collection.download(BEE_URL, hash, directoryStructure[0].path)

    expect(file.name).toEqual(name)
    expect(file.data).toEqual(directoryStructure[0].data)
  })

  it('should work with pinning', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure, { pin: true })
    const file = await collection.download(BEE_URL, hash, directoryStructure[0].path)

    expect(file.name).toEqual(directoryStructure[0].path)
    expect(file.data).toEqual(directoryStructure[0].data)
  })

  it('should work with encryption', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure, { encrypt: true })
    const file = await collection.download(BEE_URL, hash, directoryStructure[0].path)

    expect(file.name).toEqual(directoryStructure[0].path)
    expect(file.data).toEqual(directoryStructure[0].data)
    expect(hash.length).toEqual(ENCRYPTED_REFERENCE_HEX_LENGTH)
  })

  it('should upload bigger file', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: new Uint8Array(32 * 1024 * 1024),
      },
    ]

    const response = await collection.upload(BEE_URL, directoryStructure)

    expect(typeof response).toEqual('string')
  }, 20000)

  it('should throw error when the upload url is not set', async () => {
    await expect(
      collection.upload((undefined as unknown) as string, (undefined as unknown) as []),
    ).rejects.toThrowError()
  })

  it('should throw error when the upload url is not empty', async () => {
    const url = ''
    await expect(collection.upload(url, (undefined as unknown) as [])).rejects.toThrowError()
  })

  it('should throw error when the collection is empty', async () => {
    await expect(collection.upload(BEE_URL, [])).rejects.toThrowError()
  })

  it('should store and retrieve collection', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
      {
        path: '1',
        data: Uint8Array.from([1]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure)

    const file0 = await collection.download(BEE_URL, hash, directoryStructure[0].path)
    expect(file0.name).toEqual(directoryStructure[0].path)
    expect(file0.data).toEqual(directoryStructure[0].data)

    const file1 = await collection.download(BEE_URL, hash, directoryStructure[1].path)
    expect(file1.name).toEqual(directoryStructure[1].path)
    expect(file1.data).toEqual(directoryStructure[1].data)
  })

  it('should store and retrieve collection with index document', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
      {
        path: '1',
        data: Uint8Array.from([1]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure, {
      indexDocument: '0',
    })

    const indexFile = await collection.download(BEE_URL, hash)
    expect(indexFile.name).toEqual(directoryStructure[0].path)
    expect(indexFile.data).toEqual(directoryStructure[0].data)
  })

  it('should store and retrieve collection with error document', async () => {
    const directoryStructure: Collection<Uint8Array> = [
      {
        path: '0',
        data: Uint8Array.from([0]),
      },
      {
        path: '1',
        data: Uint8Array.from([1]),
      },
    ]

    const hash = await collection.upload(BEE_URL, directoryStructure, {
      errorDocument: '0',
    })

    const errorFile = await collection.download(BEE_URL, hash, 'error')
    expect(errorFile.name).toEqual(directoryStructure[0].path)
    expect(errorFile.data).toEqual(directoryStructure[0].data)
  })

  it('should store and retrieve actual directory', async () => {
    const path = 'test/data/'
    const dir = `./${path}`
    const file3Name = '3.txt'
    const subDir = 'sub/'
    const data = Uint8Array.from([51, 10])
    const directoryStructure = await collection.buildCollection(dir)
    const hash = await collection.upload(BEE_URL, directoryStructure)

    const file3 = await collection.download(BEE_URL, hash, `${subDir}${file3Name}`)
    expect(file3.name).toEqual(file3Name)
    expect(file3.data).toEqual(data)
  })

  it('should store and retrieve actual directory with index document', async () => {
    const path = 'test/data/'
    const dir = `./${path}`
    const fileName = '1.txt'
    const data = Uint8Array.from([49, 10])
    const directoryStructure = await collection.buildCollection(dir)
    const hash = await collection.upload(BEE_URL, directoryStructure, { indexDocument: `${fileName}` })

    const file1 = await collection.download(BEE_URL, hash)
    expect(file1.name).toEqual(fileName)
    expect(file1.data).toEqual(data)
  })
})
