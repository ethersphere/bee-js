import { batch, makeBee } from '../utils'

const bee = makeBee()

async function roundTrip(filename: string, content: string): Promise<void> {
  const file = new File([content], filename, { type: 'text/plain' })
  const result = await bee.collection.uploadFromFileList(batch(), [file])
  expect(result.reference).toBeTruthy()

  const downloaded = await bee.file.download(result.reference, filename)
  expect(downloaded.data.toUtf8()).toBe(content)
}

test('short filename does not use longlink', async () => {
  await roundTrip('hello.txt', 'short filename content')
})

test('filename exactly 100 chars (boundary, no longlink)', async () => {
  // 96 'a' chars + '.txt' = 100 chars → fits in name field directly
  await roundTrip('a'.repeat(96) + '.txt', 'exactly 100 char filename')
})

test('path over 100 chars with valid USTAR prefix split (no longlink)', async () => {
  // Total 101 chars: prefix "folder" (6) + "/" + name (94) → both within USTAR limits
  await roundTrip('folder/' + 'a'.repeat(94), 'ustar split via short prefix')
})

test('deeply nested path within USTAR limits (no longlink)', async () => {
  // prefix = "aa.../bb..." (153 chars), name = "file.txt" (8) → fits USTAR
  await roundTrip('a'.repeat(76) + '/' + 'b'.repeat(76) + '/file.txt', 'nested ustar path')
})

test('maximum USTAR path (prefix=155, name=100, total=256, no longlink)', async () => {
  // Exactly at the USTAR limit: prefix 155, name 100, split on the only slash
  await roundTrip('a'.repeat(155) + '/' + 'b'.repeat(100), 'max ustar path content')
})

test('filename 101 chars with no directory triggers longlink', async () => {
  // One char over the 100-char name field limit → GNU LongLink required
  await roundTrip('a'.repeat(97) + '.txt', 'longlink 101 char filename')
})

test('filename 150 chars triggers longlink', async () => {
  await roundTrip('a'.repeat(146) + '.txt', 'longlink 150 char filename')
})

test('filename 200 chars triggers longlink', async () => {
  await roundTrip('a'.repeat(196) + '.txt', 'longlink 200 char filename')
})

test('path with prefix exceeding 155 triggers longlink', async () => {
  // Only split at the slash gives prefix=156 > 155 → GNU LongLink
  await roundTrip('a'.repeat(156) + '/' + 'b'.repeat(10), 'longlink prefix over 155')
})

test('path with name portion exceeding 100 at only split triggers longlink', async () => {
  // Only split gives name=101 > 100 → GNU LongLink
  await roundTrip('a'.repeat(155) + '/' + 'b'.repeat(101), 'longlink name over 100')
})

test('deeply nested path with no valid split triggers longlink', async () => {
  // Any split gives either prefix > 155 or name > 100 → GNU LongLink
  const path = 'a'.repeat(100) + '/' + 'b'.repeat(100) + '/' + 'c'.repeat(100)
  await roundTrip(path, 'deep nested longlink content')
})

test('mixed upload: short filename + USTAR path + longlink filename', async () => {
  const short = new File(['short content'], 'index.html', { type: 'text/html' })
  const ustar = new File(['ustar content'], 'images/' + 'a'.repeat(94), { type: 'text/plain' })
  const longlink = new File(['longlink content'], 'a'.repeat(150), { type: 'text/plain' })

  const result = await bee.collection.uploadFromFileList(batch(), [short, ustar, longlink])
  expect(result.reference).toBeTruthy()

  const d1 = await bee.file.download(result.reference, 'index.html')
  expect(d1.data.toUtf8()).toBe('short content')

  const d2 = await bee.file.download(result.reference, 'images/' + 'a'.repeat(94))
  expect(d2.data.toUtf8()).toBe('ustar content')

  const d3 = await bee.file.download(result.reference, 'a'.repeat(150))
  expect(d3.data.toUtf8()).toBe('longlink content')
})

test('two longlink files uploaded together', async () => {
  const file1 = new File(['first file content'], 'a'.repeat(150), { type: 'text/plain' })
  const file2 = new File(['second file content'], 'b'.repeat(150), { type: 'text/plain' })

  const result = await bee.collection.uploadFromFileList(batch(), [file1, file2])
  expect(result.reference).toBeTruthy()

  const d1 = await bee.file.download(result.reference, 'a'.repeat(150))
  expect(d1.data.toUtf8()).toBe('first file content')

  const d2 = await bee.file.download(result.reference, 'b'.repeat(150))
  expect(d2.data.toUtf8()).toBe('second file content')
})

test('many longlink files uploaded together', async () => {
  const files = ['p', 'q', 'r', 's', 't'].map((char, i) => ({
    name: char.repeat(150),
    content: `content for file ${i + 1}`,
  }))

  const fileObjects = files.map(f => new File([f.content], f.name, { type: 'text/plain' }))
  const result = await bee.collection.uploadFromFileList(batch(), fileObjects)
  expect(result.reference).toBeTruthy()

  for (const { name, content } of files) {
    const downloaded = await bee.file.download(result.reference, name)
    expect(downloaded.data.toUtf8()).toBe(content)
  }
})

test('longlink path with directory prefix and long filename', async () => {
  // Directory prefix is short, but the filename itself is > 100 chars → longlink on name
  const dir = 'assets/images/'
  const name = 'a'.repeat(101)
  await roundTrip(dir + name, 'longlink with dir prefix')
})

test('path just over USTAR limit (257 chars) triggers longlink', async () => {
  // 155 prefix + "/" + 101 name = 257 — one char past the USTAR maximum
  await roundTrip('a'.repeat(155) + '/' + 'b'.repeat(101), 'one past ustar limit')
})
