import { transformSync, transform } from 'esbuild'

export default {
  process(input, file, options) {
    const format = options.supportsStaticESM ? 'esm' : 'cjs'

    return transformSync(input, {
      // target: `node${process.versions.node}`,
      platform: 'node',
      format,
      loader: 'ts',
      sourcemap: 'external',
      sourcefile: file,
    })
  },
  async processAsync(input, file, options) {
    const format = options.supportsStaticESM ? 'esm' : 'cjs'

    return transform(input, {
      // target: `node${process.versions.node}`,
      platform: 'node',
      format,
      loader: 'ts',
      sourcemap: 'external',
      sourcefile: file,
    })
  },
}
