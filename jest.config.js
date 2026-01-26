import { Dates, Strings, System, Types } from 'cafe-utility'

export default async () => {
  const url = Types.asString(process.env.JEST_BEE_URL, { name: 'JEST_BEE_URL' })
  Types.asString(process.env.JEST_BEE_SIGNER, { name: 'JEST_BEE_SIGNER' })
  Types.asHexString(process.env.JEST_MANAGED_BATCH_ID, { name: 'JEST_MANAGED_BATCH_ID', byteLength: 32 })
  Types.asHexString(process.env.JEST_EXTERNAL_BATCH_ID, { name: 'JEST_EXTERNAL_BATCH_ID', byteLength: 32 })
  Types.asString(process.env.JEST_WITHDRAW_ADDRESS, { name: 'JEST_WITHDRAW_ADDRESS' })

  console.log(`Waiting for Bee at ${url} to warm up...`)

  await System.waitFor(
    async () => {
      const response = await fetch(Strings.joinUrl([url, 'status']))
      const json = await response.json()
      return json.isWarmingUp === false
    },
    { attempts: 30, waitMillis: Dates.seconds(1) },
  )

  console.log('Bee is ready!')

  return {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'json-summary'],
    collectCoverageFrom: ['src/**/*.ts'],
    moduleDirectories: ['node_modules'],
    projects: [
      {
        preset: 'ts-jest',
        displayName: 'node',
        testEnvironment: 'node',
        testRegex: 'test/.*\\.spec\\.ts',
      },
    ],
    rootDir: 'test',
    testPathIgnorePatterns: ['/node_modules/'],
    testTimeout: Dates.minutes(4),
    verbose: true,
  }
}
