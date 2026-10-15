import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as ts from 'typescript'
import { transform } from '../../codemod/transforms/v13'

const BEE_V12_DECLARATION = `export declare class Bee {
  constructor(url: string)
  isConnected(): Promise<boolean>
  uploadData(batchId: string, data: string): Promise<string>
  getAllPins(): Promise<string[]>
}`

const VITEST_DECLARATION = `export type Mocked<T> = { [K in keyof T]: T[K] } & T
export declare const vi: { mocked<T>(value: T): Mocked<T> }`

function runTransform(source: string): string | null {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bee-js-codemod-'))

  try {
    const write = (relative: string, contents: string) => {
      const target = path.join(root, relative)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, contents, 'utf8')

      return target
    }

    write('node_modules/@ethersphere/bee-js/package.json', '{ "types": "index.d.ts" }')
    write('node_modules/@ethersphere/bee-js/index.d.ts', BEE_V12_DECLARATION)
    write('node_modules/vitest/package.json', '{ "types": "index.d.ts" }')
    write('node_modules/vitest/index.d.ts', VITEST_DECLARATION)

    const entry = write('input.ts', source)
    const program = ts.createProgram([entry], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      noEmit: true,
    })
    const sourceFile = program.getSourceFile(entry)

    if (!sourceFile) {
      throw Error('fixture source file missing')
    }

    return transform(sourceFile, program.getTypeChecker())
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

test('rewrites a Bee reference wrapped in a generic type', () => {
  const result = runTransform(
    `import type { Bee } from '@ethersphere/bee-js'
import type { Mocked } from 'vitest'

declare let mockBeeInstance: Mocked<Bee>
mockBeeInstance.isConnected()`,
  )

  expect(result).toContain('mockBeeInstance.connectivity.isConnected()')
})

test('rewrites a Bee reference wrapped in a qualified generic type', () => {
  const result = runTransform(
    `import type { Bee } from '@ethersphere/bee-js'

declare let mockBeeInstance: jest.Mocked<Bee>
mockBeeInstance.uploadData('batch', 'data')`,
  )

  expect(result).toContain("mockBeeInstance.data.upload('batch', 'data')")
})

test('rewrites a Bee reference wrapped in a generic union member', () => {
  const result = runTransform(
    `import type { Bee } from '@ethersphere/bee-js'

declare let bee: Partial<Bee> | null
bee?.getAllPins()`,
  )

  expect(result).toContain('bee?.pin.getAll()')
})

test('rewrites a wrapped Bee inferred from a mock factory', () => {
  const result = runTransform(
    `import { Bee } from '@ethersphere/bee-js'
import { vi } from 'vitest'

const mocked = vi.mocked(new Bee('http://localhost:1633'))
mocked.getAllPins()`,
  )

  expect(result).toContain('mocked.pin.getAll()')
})

test('leaves members of a Bee array alone', () => {
  const result = runTransform(
    `import type { Bee } from '@ethersphere/bee-js'

declare let bees: Bee[]
bees.getAllPins
bees[0].getAllPins()`,
  )

  expect(result).toContain('bees.getAllPins\n')
  expect(result).toContain('bees[0].pin.getAll()')
})
