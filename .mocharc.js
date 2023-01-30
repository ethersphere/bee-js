module.exports = {
  extension: ['ts'],
  spec: 'test/**/*.spec.ts',
  require: ['ts-node/register', './test/tests-setup.ts'],
}
