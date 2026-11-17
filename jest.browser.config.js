export default {
  projects: [
    {
      displayName: 'browser',
      testEnvironment: 'jsdom',
      testRegex: 'test/.*\\.browser\\.spec\\.ts',
      resolver: '<rootDir>/test/browser-resolver.cjs',
      setupFiles: ['<rootDir>/test/setup-browser.cjs'],
      moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
      },
    },
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
}
