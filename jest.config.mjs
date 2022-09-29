/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import Glob from 'glob'
import * as Path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function getBrowserPathMapping () {
  const browserSourceFiles = await new Promise((resolve, reject) => {
    Glob.glob('src/**/*.browser.ts', (err, browserSourceCodes) => {
      if (err) reject(err)
      browserSourceCodes = browserSourceCodes.map(match => Path.resolve(__dirname, match))
      const codePathMapping = {}
      browserSourceCodes.map(browserFullPath => {
        const filePathArray = browserFullPath.split('.')
        filePathArray.pop()
        filePathArray.pop() //remove 'browser.ts' from '**/*.browser.ts'
        const nodeFullPath = filePathArray.join('.')
        const aliasNodeReference = `/${nodeFullPath.split('/').pop()}$` //keep the last bit of node file referencing e.g. '/file-source$'

        codePathMapping[aliasNodeReference] = browserFullPath
      })

      resolve(codePathMapping)
    })
  })

  return browserSourceFiles
}

export default async () => {
  return {
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: false,

    // This will setup the prerequisites for the tests to run
    globalSetup: './test/jest/tests-setup.ts',

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // Custom sequencer that priorities running unit tests before integration tests
    testSequencer: './test/jest/test-type-sequencer.js',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: ['/node_modules/'],

    extensionsToTreatAsEsm: ['.ts'],

    transform: {
      '.ts': './test/jest/test-transformer.js',
    },
    // Run tests from one or more projects
    projects: [
      {
        displayName: 'node:unit',
        globalSetup: '',
        testRegex: 'test/unit/((?!\\.browser).)*\\.spec\\.ts',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
      {
        displayName: 'dom:integration',
        testRegex: 'test/integration/.*\\.browser\\.spec\\.ts',
        moduleNameMapper: await getBrowserPathMapping(),
        preset: 'jest-puppeteer',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
      {
        displayName: 'node:integration',
        testRegex: 'test/integration/((?!\\.browser).)*\\.spec\\.ts',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
    ],
  }
}
