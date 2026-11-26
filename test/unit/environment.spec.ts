import { whereAmI } from '../../src/utils/environment'

test('whereAmI detects Node', () => {
  expect(whereAmI()).toBe('node')
})
