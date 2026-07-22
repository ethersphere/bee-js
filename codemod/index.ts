import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

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

const transformFiles = fs
  .readdirSync(transformsDir)
  .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))
  .sort()
  .filter(f => parseVersion(f) > fromVersion)

if (transformFiles.length === 0) {
  console.log('No transforms to apply.')
  process.exit(0)
}

console.log(`Applying: ${transformFiles.join(', ')}\n`)

// Type-aware transform: receives a parsed source file plus the program's type checker so it
// can resolve receiver types (locals, imported instances, `this.<field>`, factory calls).
type TransformFn = (sourceFile: ts.SourceFile, checker: ts.TypeChecker) => string | null

const transforms: TransformFn[] = transformFiles.map(f => {
  const modulePath = path.join(transformsDir, f.replace(/\.ts$/, ''))
  return (require(modulePath) as { transform: TransformFn }).transform
})

const resolved = path.resolve(target)
const stat = fs.statSync(resolved)
const files = (stat.isDirectory() ? walkFiles(resolved) : [resolved]).map(f => path.resolve(f))
const targetSet = new Set(files)

// Load the target project's compiler options so imports and the bee-js types resolve; fall
// back to permissive defaults when no tsconfig is found nearby.
function loadCompilerOptions(from: string): ts.CompilerOptions {
  const configPath = ts.findConfigFile(from, ts.sys.fileExists, 'tsconfig.json')

  if (configPath) {
    const read = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(read.config ?? {}, ts.sys, path.dirname(configPath))

    return { ...parsed.options, noEmit: true, allowJs: true, checkJs: false }
  }

  return {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }
}

const options = loadCompilerOptions(stat.isDirectory() ? resolved : path.dirname(resolved))
const changedFiles = new Set<string>()

// Each transform version gets a freshly built program so it sees edits from the previous one.
for (const transform of transforms) {
  const program = ts.createProgram(files, options)
  const checker = program.getTypeChecker()

  for (const sourceFile of program.getSourceFiles()) {
    const filePath = path.resolve(sourceFile.fileName)
    if (!targetSet.has(filePath)) continue

    const result = transform(sourceFile, checker)

    if (result !== null && result !== sourceFile.text) {
      fs.writeFileSync(filePath, result, 'utf8')
      console.log(`updated: ${filePath}`)
      changedFiles.add(filePath)
    }
  }
}

console.log(`\n${changedFiles.size} file(s) updated, ${files.length - changedFiles.size} unchanged.`)
