// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sequencer = require('@jest/test-sequencer').default

/**
 * Jest Sequencer that allows to specify order of execution of tests.
 * We are using it to first execute unit tests and then integration when
 * whole test suite is run.
 *
 * https://jestjs.io/docs/next/configuration#testsequencer-string
 */
class TestTypeSequencer extends Sequencer {
  order = ['unit', 'integration']

  getType(test) {
    for (const type of this.order) {
      if (test.path.includes(type)) {
        return type
      }
    }
  }

  sort(tests) {
    // Test structure information
    // https://github.com/facebook/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
    const copyTests = Array.from(tests)

    return copyTests.sort((testA, testB) => {
      const typeA = this.getType(testA)
      const typeB = this.getType(testB)

      return this.order.indexOf(typeA) - this.order.indexOf(typeB)
    })
  }
}

module.exports = TestTypeSequencer
