module.exports = {
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'plugin:prettier/recommended'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
    project: './tsconfig.test.json'
  },
  env: {
    jest: true,
  },
  globals: {
    browser: true,
    page: true,
  },
  plugins: ['jest', 'unused-imports'],
  rules: {
    'array-bracket-newline': ['error', 'consistent'],
    strict: ['error', 'safe'],
    'block-scoped-var': 'error',
    complexity: 'warn',
    'default-case': 'error',
    'dot-notation': 'warn',
    eqeqeq: 'error',
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
    'no-implicit-coercion': 'error',
    'prefer-arrow-callback': 'warn',
    'no-labels': 'error',
    'no-loop-func': 'error',
    'no-nested-ternary': 'warn',
    'no-script-url': 'error',
    'no-warning-comments': 'warn',
    'quote-props': ['error', 'as-needed'],
    'require-yield': 'error',
    'max-nested-callbacks': ['error', 4],
    'max-depth': ['error', 4],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'if' },
      { blankLine: 'always', prev: '*', next: 'function' },
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
    'no-useless-constructor': 'off',
    'no-dupe-class-members': 'off',
    'no-unused-expressions': 'off',
    curly: ['error', 'multi-line'],
    'object-curly-spacing': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': 'allow-with-description',
        minimumDescriptionLength: 6,
      },
    ],
    "require-await": "off",
    "@typescript-eslint/promise-function-async": "error",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ]
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        'max-nested-callbacks': ['error', 10], // allow describe/it nesting
      },
    },
  ],
}
