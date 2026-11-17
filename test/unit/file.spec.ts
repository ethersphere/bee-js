import { parseFilename } from '../../src/utils/file'

test.each([
  ['dir/archive.tar.gz', { basename: 'archive.tar', extension: 'gz', filename: 'archive.tar.gz' }],
  ['c:\\docs\\readme.md', { basename: 'readme', extension: 'md', filename: 'readme.md' }],
  ['.hidden', { basename: '.hidden', extension: '', filename: '.hidden' }],
  ['noext', { basename: 'noext', extension: '', filename: 'noext' }],
])('parseFilename(%s)', (path, expected) => {
  expect(parseFilename(path)).toEqual(expected)
})
