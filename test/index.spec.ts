import Bee from '../src'
import debug from 'debug'

const log = debug('index:')

const BEE_URL: string = process.env.BEE_URL || 'http://bee-0.localhost'

describe('Bee class', () => {
  let bee: Bee

  beforeEach(() => {
    log(`Bee connection URL: ${BEE_URL}`)
    bee = new Bee(BEE_URL)
  })
  it('should give proper bee URL', () => {
    // eslint-disable-next-line no-console
    expect(bee.url).toBe(BEE_URL)
  })
})
