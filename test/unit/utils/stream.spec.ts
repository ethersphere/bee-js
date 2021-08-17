import { Readable } from 'stream'
import { readableNodeToWeb, readableWebToNode } from '../../../src/utils/stream'
import { bytesEqual } from '../../../src/utils/bytes'

async function getAllReadable(read: Readable): Promise<any[]> {
  const arr = []

  for await (const readElement of read) {
    arr.push(readElement)
  }

  return arr
}

describe('stream', () => {
  it('should convert from nodejs readable to whatwg readablestream and back', async () => {
    const input = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])]
    const nodeJsReadable = Readable.from(input)

    const readableStream = readableNodeToWeb(nodeJsReadable)
    const nodeJsRevertedReadable = readableWebToNode(readableStream, { highWaterMark: 1 })

    const result = await getAllReadable(nodeJsRevertedReadable)
    expect(result.length).toEqual(input.length)

    for (let i = 0; i < input.length; i++) {
      expect(bytesEqual(result[i], input[i])).toBeTruthy()
    }
  })
})
