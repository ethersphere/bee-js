
import Path from 'path'
import { DefinePlugin, NormalModuleReplacementPlugin, Configuration, WebpackPluginInstance } from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import TerserPlugin from 'terser-webpack-plugin'
import PackageJson from './package.json'

interface WebpackEnvParams {
  target: 'web' | 'node'
  debug: boolean
  mode: 'production' | 'development'
  fileName: string
}

const base = (env?: Partial<WebpackEnvParams>): Configuration => {
  const isProduction = env?.mode === 'production'
  const filename = env?.fileName || [
    'index',
    isProduction ? '.min' : null,
    '.js'
  ]
    .filter(Boolean)
    .join('')
  const entry = Path.resolve(__dirname, 'src')
  const path = Path.resolve(__dirname, 'dist')
  const target = env?.target || 'web' // 'node' or 'web'
  const plugins: WebpackPluginInstance[] = [
    new DefinePlugin({
      'process.env.ENV': env?.mode || 'development',
      'process.env.IS_WEBPACK_BUILD': 'true'
    })
  ]

  if (target === 'web') {
    plugins.push(
      new NormalModuleReplacementPlugin(/stream/, (resource) => {
        resource.request = resource.request.replace(/stream/, 'readable-stream')
      })
    )
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
      library: PackageJson.name,
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.(ts|js)$/,
              include: entry,
              use: {
                loader: 'babel-loader'
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
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
              ecma: 2018
            },
            compress: {
              ecma: 5
            },
            mangle: {
              safari10: true
            },
            output: {
              ecma: 5,
              comments: false
            }
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true
        })
      ]
    },
    plugins,
    target,
    node: {
      global: false,
      __filename: 'mock',
      __dirname: 'mock'
    },
    performance: {
      hints: false
    }
  }
}

export default (env?: Partial<WebpackEnvParams>): Configuration => {
  if (env?.debug) {
    const config = {
      ...base(env),
      plugins: [new BundleAnalyzerPlugin()],
      profile: true
    }

    return config
  }

  return base(env)
}
