/* eslint-disable no-console */
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */
import type { Config } from '@jest/types'
import { glob } from 'glob'
import * as Path from 'path'
import { createPostageBatch, getPostageBatch } from './src/modules/stamps'
import type { BatchId } from './src'

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
    const beeUrl = process.env.BEE_API_URL || 'http://localhost:1633'
    const beePeerUrl = process.env.BEE_PEER_API_URL || 'http://localhost:11633'

    if (process.env.BEE_POSTAGE) {
      try {
        if (!(await getPostageBatch(beeUrl, process.env.BEE_POSTAGE as BatchId)).usable) {
          delete process.env.BEE_POSTAGE
          console.log('BEE_POSTAGE stamp was found but is not usable')
        } else {
          console.log('Using configured BEE_POSTAGE stamp.')
        }
      } catch (e) {
        delete process.env.BEE_POSTAGE
        console.log('BEE_POSTAGE stamp was not found')
      }
    }

    if (process.env.BEE_PEER_POSTAGE) {
      try {
        if (!(await getPostageBatch(beePeerUrl, process.env.BEE_PEER_POSTAGE as BatchId)).usable) {
          delete process.env.BEE_PEER_POSTAGE
          console.log('BEE_PEER_POSTAGE stamp was found but is not usable')
        } else {
          console.log('Using configured BEE_PEER_POSTAGE stamp.')
        }
      } catch (e) {
        delete process.env.BEE_PEER_POSTAGE
        console.log('BEE_PEER_POSTAGE stamp was not found')
      }
    }

    if (!process.env.BEE_POSTAGE || !process.env.BEE_PEER_POSTAGE) {
      console.log('Creating postage stamps...')

      const stampsOrder: { url: string; env: string }[] = []

      if (!process.env.BEE_POSTAGE) {
        stampsOrder.push({ url: beeUrl, env: 'BEE_POSTAGE' })
      }

      if (!process.env.BEE_PEER_POSTAGE) {
        stampsOrder.push({ url: beePeerUrl, env: 'BEE_PEER_POSTAGE' })
      }

      const stamps = await Promise.all(stampsOrder.map(async order => createPostageBatch(order.url, '1', 20)))

      for (let i = 0; i < stamps.length; i++) {
        process.env[stampsOrder[i].env] = stamps[i]
        console.log(`${stampsOrder[i].env}: ${stamps[i]}`)
      }

      console.log('Waiting for the stamps to be usable')
      let allUsable = true
      do {
        for (let i = 0; i < stamps.length; i++) {
          // eslint-disable-next-line max-depth
          try {
            // eslint-disable-next-line max-depth
            if (!(await getPostageBatch(stampsOrder[i].url, stamps[i] as BatchId)).usable) {
              allUsable = false
              break
            } else {
              allUsable = true
            }
          } catch (e) {
            allUsable = false
            break
          }
        }

        // eslint-disable-next-line no-loop-func
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1_000))
      } while (!allUsable)
      console.log('Usable, yey!')
    }
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
    projects: [
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
    ] as unknown[] as string[], // bad types

    // The root directory that Jest should scan for tests and modules within
    rootDir: 'test',

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ['/node_modules/'],
  }
}
