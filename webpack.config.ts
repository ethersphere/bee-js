/* eslint-disable no-console */
import Path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import { Configuration, DefinePlugin, WebpackPluginInstance } from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

interface WebpackEnvParams {
  debug: boolean
  fileName: string
}

const base = async (env?: Partial<WebpackEnvParams>): Promise<Configuration> => {
  const isProduction = process.env['NODE_ENV'] === 'production'
  const filename = env?.fileName || ['index.browser', isProduction ? '.min' : null, '.js'].filter(Boolean).join('')
  const entry = Path.resolve(__dirname, 'src')
  const path = Path.resolve(__dirname, 'dist')
  const plugins: WebpackPluginInstance[] = [
    new DefinePlugin({
      'process.env.ENV': process.env['NODE_ENV'] || 'development',
      'process.env.IS_WEBPACK_BUILD': 'true',
    }),
  ]

  return {
    bail: Boolean(isProduction),
    mode: (process.env['NODE_ENV'] as 'production') || 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry,
    output: {
      path,
      filename,
      sourceMapFilename: '[file].map[query]',
      library: 'BeeJs',
      libraryTarget: 'umd',
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
          },
        }),
      ],
    },
    plugins,
    performance: {
      hints: false,
    },
  }
}

export default async (env?: Partial<WebpackEnvParams>): Promise<Configuration> => {
  const nodeEnv = process.env['NODE_ENV'] || 'development'

  if (nodeEnv == 'debug') {
    const config = {
      ...(await base(env)),
      plugins: [new BundleAnalyzerPlugin()],
      profile: true,
    }

    return config
  }

  return base(env)
}
