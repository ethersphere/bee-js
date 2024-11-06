import { Binary } from 'cafe-utility'
import { PassThrough } from 'stream'
import * as NodeTar from '../../src/utils/tar'
import * as BrowserTar from '../../src/utils/tar.browser'

function passThroughToUint8Array(passThrough: PassThrough): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    passThrough.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk)
    })
    passThrough.on('end', () => {
      resolve(Binary.concatBytes(...chunks))
    })
    passThrough.on('error', reject)
  })
}

describe('Tar', () => {
  it('should write tar', async () => {
    const browserStream = new BrowserTar.TarStream()
    const nodeStream = new NodeTar.TarStream()
    const nodePromise = passThroughToUint8Array(nodeStream.output)
    const data = new Uint8Array([1, 2, 3, 4, 5])
    browserStream.beginFile('test.txt', data.length)
    nodeStream.beginFile('test.txt', data.length)
    await browserStream.appendFile(data)
    await nodeStream.appendFile(data)
    await browserStream.endFile()
    await nodeStream.endFile()
    await browserStream.end()
    await nodeStream.end()
    const browserOutput = browserStream.output
    expect(browserOutput).toBeInstanceOf(Uint8Array)
    expect(browserOutput).toHaveLength(2048)
    const nodeOutput = nodeStream.output
    expect(nodeOutput).toBeInstanceOf(PassThrough)
    const nodeBytes = await nodePromise
    expect(nodeBytes).toBeInstanceOf(Uint8Array)
    expect(nodeBytes).toHaveLength(2048)
    expect(browserOutput).toEqual(nodeBytes)
  })
})
