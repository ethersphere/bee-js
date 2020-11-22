
import { DefinePlugin } from 'webpack'
import { Config, ConfigOptions } from 'karma'
import webpackConfig from './webpack.config'
import Path from 'path'
import yargsParser from 'yargs-parser'

interface MochaCommonOptions {
  reporter: string
  timeout: number
  bail?: boolean
  grep?: string
}

interface MochaWebWorker extends MochaCommonOptions {
  pattern: string[]
}

interface KarmaEnvParams {
  filesCustom: string[]
  timeout: number
  bail: boolean
  progress: boolean
  grep: string
}

interface ExtendedConfigOptions extends ConfigOptions {
  webpack: ReturnType<typeof webpackConfig>
  webpackMiddleware?: {
    stats: string
    noInfo: boolean
  }
  mochaReporter?: {
    output: string
    showDiff: boolean
  }
  junitReporter?: {
    outputDir: string
    outputFile: string
    useBrowserName: boolean
  }
}

const isWebworker = process.env.RUNNER === 'webworker'
const testFolder = Path.resolve(__dirname, 'test')
const allTestFiles = Path.resolve(testFolder, 'karma-entry.js')

// Env to pass in the bundle with DefinePlugin
const env = {
  'process.env.RUNNER': JSON.stringify(process.env.RUNNER),
  'process.env.ENV': JSON.stringify(process.env.ENV),
  'process.env.IS_WEBPACK_BUILD': JSON.stringify(true),
  TEST_DIR: testFolder
}

// Webpack overrides for karma
let generatedWebpackConfig = webpackConfig({ mode: 'production', target: 'web', fileName: 'test' })

// In production mode multiple bundles is created, we need to test only the main one.
if (Array.isArray(generatedWebpackConfig)) {
  generatedWebpackConfig = generatedWebpackConfig[0]
}

// const path = Path.resolve(__dirname, 'dist')
const karmaWebpackConfig: ReturnType<typeof webpackConfig> = {
  ...generatedWebpackConfig,
  devtool: 'inline-source-map'
}
delete karmaWebpackConfig.entry
delete karmaWebpackConfig.output
karmaWebpackConfig.plugins?.push(new DefinePlugin(env))

const karmaConfig = (argv: Partial<KarmaEnvParams>): ExtendedConfigOptions => {
  // let files = argv.filesCustom
  const filePaths = ['test/index.spec.ts']
  // const reporters = []

  // if (argv.progress) reporters.push('progress')
  // else reporters.push('mocha')

  // if (process.env.CI) reporters.push('junit')

  // if (!files || !files.length) {
  //   // only try to load *.spec.ts if we aren't specifying custom files
  //   files = [{ pattern: 'test/**/*.spec.ts', included: false, served: true }]
  // }

  return {
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-web-security']
      }
    },
    // frameworks: isWebworker ? ['mocha-webworker'] : ['mocha'],
    frameworks: ['mocha'],
    basePath: process.cwd(),
    files: filePaths,
    // .concat([
    //  {
    //    pattern: 'test/fixtures/**/*',
    //    watched: false,
    //    served: true,
    //    included: false
    //  }
    // ]),

    // preprocessors: filePaths.reduce((acc: Record<string, string[]>, f) => {
    //   // acc[f] = ['webpack', 'sourcemap']
    //   acc[f] = ['webpack']

    //   return acc
    // }, {}),
    preprocessors: {
      'test/**/*.spec.ts': ['webpack']
    },

    client: {
      captureConsole: true
    },

    webpack: karmaWebpackConfig,

    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only'
    },

    // reporters,

    // mochaReporter: {
    //   output: 'autowatch',
    //   showDiff: true
    // },

    // junitReporter: {
    //   outputDir: process.cwd(),
    //   outputFile: isWebworker ? 'junit-report-webworker.xml' : 'junit-report-browser.xml',
    //   useBrowserName: false
    // },

    plugins: [
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-edge-launcher',
      'karma-firefox-launcher',
      'karma-junit-reporter',
      'karma-mocha'
      // 'karma-mocha-reporter',
      // 'karma-mocha-webworker',
      // 'karma-sourcemap-loader'
    ],

    autoWatch: false,
    singleRun: true,
    colors: true,
    browserNoActivityTimeout: 50 * 1000
  }
}

module.exports = (config: Config): void => {
  const argv = yargsParser(process.argv.slice(2), {
    array: ['files-custom'],
    boolean: ['progress', 'bail'],
    string: ['timeout']
  })
  config.set(karmaConfig(argv as Partial<KarmaEnvParams>))
}
