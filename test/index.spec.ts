import Bee from '../src';
import { expect } from 'chai';
import debug from 'debug';

const log = debug('index:');

const BEE_URL: string = process.env.BEE_URL || 'http://bee-0.localhost';

describe('Bee class', () => {
  let bee: Bee;

  before(() => {
    log(`Bee connection URL: ${BEE_URL}`);
    bee = new Bee(BEE_URL);
  });
  it('should give proper bee URL', () => {
    expect(bee.url).to.equal(BEE_URL);
  });
});
