/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default async () => {
  return {
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: false,

    // This will setup the prerequisites for the tests to run
    globalSetup: './test/jest/postage-setup.js',
    setupFiles: ['./test/jest/tests-setup.js'],

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
        setupFiles: ['./test/jest/tests-setup.js'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
      {
        displayName: 'dom:integration',
        testRegex: 'test/integration/.*\\.browser\\.spec\\.ts',
        preset: 'jest-puppeteer',
        extensionsToTreatAsEsm: ['.ts'],
        setupFiles: ['./test/jest/tests-setup.js'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
      {
        displayName: 'node:integration',
        testRegex: 'test/integration/((?!\\.browser).)*\\.spec\\.ts',
        extensionsToTreatAsEsm: ['.ts'],
        setupFiles: ['./test/jest/tests-setup.js'],
        transform: {
          '.ts': './test/jest/test-transformer.js',
        },
      },
    ],
  }
}
