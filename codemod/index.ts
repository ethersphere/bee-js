import * as fs from 'fs'
import * as path from 'path'

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

function walkFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        files.push(...walkFiles(path.join(dir, entry.name)))
      }
    } else if (entry.isFile() && EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(path.join(dir, entry.name))
    }
  }
  return files
}

function parseVersion(filename: string): number {
  const match = path.basename(filename).match(/^v?(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

const args = process.argv.slice(2)
const fromIdx = args.indexOf('--from')
const fromVersion = fromIdx !== -1 ? parseVersion(args[fromIdx + 1]) : 0
const target = args.find((a, i) => !a.startsWith('--') && (fromIdx === -1 || i !== fromIdx + 1))

if (!target) {
  console.error('Usage: ts-node --project codemod/tsconfig.json codemod/index.ts <path> [--from <version>]')
  console.error('Example: npm run codemod -- ./src --from v12')
  process.exit(1)
}

const transformsDir = path.join(__dirname, 'transforms')

const transformFiles = fs.readdirSync(transformsDir)
  .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))
  .sort()
  .filter(f => parseVersion(f) > fromVersion)

if (transformFiles.length === 0) {
  console.log('No transforms to apply.')
  process.exit(0)
}

console.log(`Applying: ${transformFiles.join(', ')}\n`)

type TransformFn = (source: string, filename: string) => string

const transforms: TransformFn[] = transformFiles.map(f => {
  const modulePath = path.join(transformsDir, f.replace(/\.ts$/, ''))
  return (require(modulePath) as { transform: TransformFn }).transform
})

const resolved = path.resolve(target)
const stat = fs.statSync(resolved)
const files = stat.isDirectory() ? walkFiles(resolved) : [resolved]

let changed = 0

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8')
  let fileChanged = false

  for (const transform of transforms) {
    const result = transform(source, file)
    if (result !== source) {
      source = result
      fileChanged = true
    }
  }

  if (fileChanged) {
    fs.writeFileSync(file, source, 'utf8')
    console.log(`updated: ${file}`)
    changed++
  }
}

console.log(`\n${changed} file(s) updated, ${files.length - changed} unchanged.`)
