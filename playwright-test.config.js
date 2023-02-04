const { NodeModulesPolyfillPlugin } = require('@esbuild-plugins/node-modules-polyfill')
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill')

module.exports = {
  buildConfig: {
    plugins: [
      NodeModulesPolyfillPlugin(),
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true,
      }),
    ],
  },
}
