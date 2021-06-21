/* eslint-disable no-console */
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import type { Config } from '@jest/types'
import * as Path from 'path'
import { glob } from 'glob'
import { createPostageBatch } from './src/modules/stamps'

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
  try {
    console.log('Creating postage stamps...')
    const beeUrl = process.env.BEE_API_URL || 'http://localhost:1635'
    const beePeerUrl = process.env.BEE_PEER_API_URL || 'http://localhost:11635'
    const stamps = await Promise.all([createPostageBatch(beeUrl, '1', 20), createPostageBatch(beePeerUrl, '1', 20)])
    process.env.BEE_POSTAGE = stamps[0]
    console.log('Queen stamp: ', process.env.BEE_POSTAGE)
    process.env.BEE_PEER_POSTAGE = stamps[1]
    console.log('Peer stamp: ', process.env.BEE_PEER_POSTAGE)
  } catch (e) {
    // It is possible that for unit tests the Bee nodes does not run
    // so we are only logging errors and not leaving them to propagate
    console.error(e)
  }

  return {
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: false,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // Custom sequencer that priorities running unit tests before integration tests
    testSequencer: '<rootDir>/test-type-sequencer.js',

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
