/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import type { Config } from '@jest/types'
import * as Path from 'path'
import { glob } from 'glob'

/**
 * Get 'alias' configuration of Jest and Webpack for browser testing and compilation.
 */
export async function getBrowserPathMapping(): Promise<{ [aliasNodeReference: string]: string }> {
  const browserSourceFiles = await new Promise<{ [aliasNodeReference: string]: string }>((resolve, reject) => {
    glob('src/**/*.browser.ts', (err, browserSourceCodes) => {
      if (err) reject(err)
      browserSourceCodes = browserSourceCodes.map(match => Path.resolve(__dirname, match))
      const codePathMapping: { [nodeFullPath: string]: string } = {}
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

export default async (): Promise<Config.InitialOptions> => {
  return {
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: false,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: ['/node_modules/'],

    // An array of directory names to be searched recursively up from the requiring module's location
    moduleDirectories: ['node_modules'],

    // Run tests from one or more projects
    projects: ([
      // We don't have any DOM specific tests atm.
      // {
      //   displayName: 'dom:unit',
      //   testRegex: 'test/unit/.*\\.browser\\.spec\\.ts',
      //   moduleNameMapper: await getBrowserPathMapping(),
      //   preset: 'jest-puppeteer',
      // },
      {
        displayName: 'node:unit',
        testEnvironment: 'node',
        testRegex: 'test/unit/((?!\\.browser).)*\\.spec\\.ts',
      },
      {
        displayName: 'dom:integration',
        testRegex: 'test/integration/.*\\.browser\\.spec\\.ts',
        moduleNameMapper: await getBrowserPathMapping(),
        preset: 'jest-puppeteer',
      },
      {
        displayName: 'node:integration',
        testEnvironment: 'node',
        testRegex: 'test/integration/((?!\\.browser).)*\\.spec\\.ts',
      },
    ] as unknown[]) as string[], // bad types

    // The root directory that Jest should scan for tests and modules within
    rootDir: 'test',

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ['/node_modules/'],
  }
}
