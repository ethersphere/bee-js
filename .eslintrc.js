'use strict'

module.exports = {
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    mocha: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
  },
  plugins: [
    'no-only-tests'
  ],
  rules: {
    'array-bracket-newline': ['error', { 'multiline': true }],
    strict: ['error', 'safe'],
    curly: 'error',
    'block-scoped-var': 'error',
    complexity: 'warn',
    'default-case': 'error',
    'dot-notation': 'warn',
    'guard-for-in': 'warn',
    'linebreak-style': ['warn', 'unix'],
    'no-alert': 'error',
    'no-case-declarations': 'error',
    'no-console': 'error',
    'no-constant-condition': 'error',
    'no-continue': 'warn',
    'no-div-regex': 'error',
    'no-empty': 'warn',
    'no-empty-pattern': 'error',
    'no-extra-semi': 'error',
    'no-implicit-coercion': 'error',
    'no-labels': 'error',
    'no-loop-func': 'error',
    'no-nested-ternary': 'warn',
    'no-only-tests/no-only-tests': 'error',
    'no-script-url': 'error',
    'no-warning-comments': 'warn',
    'quote-props': ['error', 'as-needed'],
    'require-yield': 'error',
    'max-nested-callbacks': ['error', 4],
    'max-depth': ['error', 4],
    'require-await': 'error',
    'padding-line-between-statements': [
      'error',
      { 'blankLine': 'always', 'prev': '*', 'next': 'if' },
      { 'blankLine': 'always', 'prev': '*', 'next': 'function' },
    ],
    'no-useless-constructor': 'off',
    'no-dupe-class-members': 'off',
    'no-unused-expressions': 'off',
    '@typescript-eslint/ban-ts-ignore': 'warn',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/member-delimiter-style': ['error', {
      'multiline': {
        'delimiter': 'none',
        'requireLast': true
      },
      'singleline': {
        'delimiter': 'comma',
        'requireLast': false
      }
    }]
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/ban-ts-ignore': 'off',
        'max-nested-callbacks': ['error', 10] // allow describe/it nesting
      }
    }
  ]
}
