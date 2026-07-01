const path = require('path')

// Mirrors the browser field in package.json: redirects src/utils node
// implementations to their browser equivalents during Jest resolution.
const REPLACEMENTS = new Map([
  ['tar.ts', 'tar.browser.ts'],
  ['data.ts', 'data.browser.ts'],
  ['chunk-stream.ts', 'chunk-stream.browser.ts'],
  ['tar-writer.ts', 'tar-writer.browser.ts'],
  ['tar-uploader.ts', 'tar-uploader.browser.ts'],
  ['collection.node.ts', 'collection.browser.ts'],
])

module.exports = (moduleName, options) => {
  const resolved = options.defaultResolver(moduleName, options)

  if (!resolved.includes('/src/utils/')) return resolved

  const basename = path.basename(resolved)
  const replacement = REPLACEMENTS.get(basename)

  if (replacement) {
    return path.join(path.dirname(resolved), replacement)
  }

  return resolved
}
