import { TarStream } from '../../src/utils/tar.browser'

test('TarStream: output is a Uint8Array (not a stream)', async () => {
  const tar = new TarStream()
  const content = new TextEncoder().encode('hello')
  tar.beginFile('hello.txt', content.length)
  await tar.appendFile(content)
  await tar.endFile()
  await tar.end()

  expect(tar.output).toBeInstanceOf(Uint8Array)
})

test('TarStream: output length is a multiple of 512 bytes', async () => {
  const tar = new TarStream()
  const content = new TextEncoder().encode('abc')
  tar.beginFile('a.txt', content.length)
  await tar.appendFile(content)
  await tar.endFile()
  await tar.end()

  expect(tar.output.length % 512).toBe(0)
})

test('TarStream: header encodes filename in first 100 bytes', async () => {
  const tar = new TarStream()
  tar.beginFile('readme.txt', 0)
  await tar.endFile()
  await tar.end()

  const name = new TextDecoder().decode(tar.output.slice(0, 13))
  expect(name).toBe('readme.txt\0\0\0')
})

test('TarStream: long filename (>100 chars) uses GNU LongLink extension', async () => {
  // A flat filename with no slashes and length > 100 always triggers LongLink
  // because splitPath can find no valid split point.
  const longName = 'b'.repeat(101) + '.txt'
  const tar = new TarStream()
  tar.beginFile(longName, 0)
  await tar.endFile()
  await tar.end()

  // LongLink header starts with '././@LongLink'
  const magic = new TextDecoder().decode(tar.output.slice(0, 13))
  expect(magic).toBe('././@LongLink')
})

test('TarStream: empty archive ends with 1024 zero bytes', async () => {
  const tar = new TarStream()
  await tar.end()

  const { output } = tar
  expect(output.length).toBe(1024)
  expect(output.every(b => b === 0)).toBe(true)
})
