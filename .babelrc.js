'use strict'

module.exports = function (api) {
  const targets = '>1% or node >=10 and not ie 11 and not dead'
  api.cache(true)
  api.cacheDirectory = true

  return {
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          corejs: 3,
          useBuiltIns: 'entry',
          modules: 'commonjs',
          bugfixes: true,
          targets
        }
      ]
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: false,
          regenerator: true
        }
      ],
      "@babel/plugin-proposal-nullish-coalescing-operator",
      '@babel/plugin-proposal-optional-chaining',
    ]
  }
}
