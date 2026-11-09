import { build } from 'esbuild'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SOURCE = resolve('src')
const BROWSER_SUFFIX = '.browser.ts'

function findBrowserVariants(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return findBrowserVariants(path)
    }

    if (!entry.name.endsWith(BROWSER_SUFFIX)) {
      return []
    }

    const base = path.slice(0, -BROWSER_SUFFIX.length)
    const nodeVariant = existsSync(`${base}.node.ts`) ? `${base}.node.ts` : `${base}.ts`

    return [[nodeVariant, path]]
  })
}

const browserVariants = new Map(findBrowserVariants(SOURCE))

const useBrowserVariants = {
  name: 'browser-variants',
  setup(build) {
    build.onResolve({ filter: /^\.{1,2}\// }, args => {
      const variant = browserVariants.get(join(args.resolveDir, args.path.replace(/\.js$/, '.ts')))

      return variant ? { path: variant } : undefined
    })
  },
}

const onlyEnglishZodLocale = {
  name: 'only-english-zod-locale',
  setup(build) {
    build.onResolve({ filter: /\/locales\/index\.js$/ }, args =>
      args.importer.includes('/node_modules/zod/') ? { path: 'zod-locales', namespace: 'zod-locales' } : undefined,
    )
    build.onLoad({ filter: /.*/, namespace: 'zod-locales' }, () => ({
      contents: "export { default as en } from 'zod/v4/locales/en.js'",
      resolveDir: process.cwd(),
    }))
  },
}

const exportAsModule = `if (typeof module === 'object' && module.exports) module.exports = BeeJs
else if (typeof define === 'function' && define.amd) define([], () => BeeJs)`

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.browser.min.js',
  bundle: true,
  format: 'iife',
  globalName: 'BeeJs',
  footer: { js: exportAsModule },
  platform: 'browser',
  target: 'es2020',
  minify: true,
  sourcemap: true,
  legalComments: 'external',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [useBrowserVariants, onlyEnglishZodLocale],
  logLevel: 'info',
})
