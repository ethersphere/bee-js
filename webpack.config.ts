/* eslint-disable no-console */
import Path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import { Configuration, DefinePlugin, NormalModuleReplacementPlugin, WebpackPluginInstance } from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { getBrowserPathMapping } from './jest.config'
import PackageJson from './package.json'

interface WebpackEnvParams {
  target: 'web' | 'node'
  debug: boolean
  mode: 'production' | 'development'
  fileName: string
}

const base = async (env?: Partial<WebpackEnvParams>): Promise<Configuration> => {
  const isProduction = env?.mode === 'production'
  const isBrowser = env?.target === 'web'
  const filename =
    env?.fileName ||
    ['index', isBrowser ? '.browser' : null, isProduction ? '.min' : null, '.js'].filter(Boolean).join('')
  const entry = Path.resolve(__dirname, 'src')
  const path = Path.resolve(__dirname, 'dist')
  const target = env?.target || 'web' // 'node' or 'web'
  console.log('target', target)
  const plugins: WebpackPluginInstance[] = [
    new DefinePlugin({
      'process.env.ENV': env?.mode || 'development',
      'process.env.IS_WEBPACK_BUILD': 'true',
    }),
  ]

  if (target === 'web') {
    const browserPathMapping = await getBrowserPathMapping()
    // eslint-disable-next-line guard-for-in
    for (const nodeReference in browserPathMapping) {
      plugins.push(
        new NormalModuleReplacementPlugin(new RegExp(`\\${nodeReference}`), browserPathMapping[nodeReference]),
      )
    }
    // change node modules to browser modules according to packageJson.browser mapping
    // eslint-disable-next-line guard-for-in
    const browserModuleMapping = PackageJson.browser as { [key: string]: string }
    // eslint-disable-next-line guard-for-in
    for (const nodeReference in browserModuleMapping) {
      const browserReference: string = browserModuleMapping[nodeReference]
      plugins.push(new NormalModuleReplacementPlugin(new RegExp(`^${nodeReference}$`), browserReference))
    }
  }

  return {
    bail: Boolean(isProduction),
    mode: env?.mode || 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry,
    output: {
      path,
      filename,
      sourceMapFilename: filename + '.map',
      // library: 'BeeJs',
      libraryTarget: 'module',
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          // include: entry,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        path: false,
        fs: false,
        stream: false,
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 2018,
            },
            compress: {
              ecma: 5,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
            },
            sourceMap: true,
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
        }),
      ],
    },
    plugins,
    target,
    node: {
      global: true,
      __filename: 'mock',
      __dirname: 'mock',
    },
    performance: {
      hints: false,
    },
    experiments: {
      // Module parse failed: The top-level-await experiment is not enabled (set experiments.topLevelAwait: true to enabled it)
      topLevelAwait: true,
      outputModule: true,
    },
  }
}

export default async (env?: Partial<WebpackEnvParams>): Promise<Configuration> => {
  // eslint-disable-next-line no-console
  console.log('env', env)

  if (env?.debug) {
    const config = {
      ...(await base(env)),
      plugins: [new BundleAnalyzerPlugin()],
      profile: true,
    }

    return config
  }

  return base(env)
}
