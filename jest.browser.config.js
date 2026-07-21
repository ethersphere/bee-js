export default {
  projects: [
    {
      displayName: 'browser',
      testEnvironment: 'jsdom',
      testRegex: 'test/.*\\.browser\\.spec\\.ts',
      resolver: '<rootDir>/test/browser-resolver.cjs',
      setupFiles: ['<rootDir>/test/setup-browser.cjs'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: { ignoreCodes: [151002] } }],
      },
    },
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
}
