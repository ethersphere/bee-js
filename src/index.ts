import * as File from './modules/file';
import * as Tag from './modules/tag';

/**
 * The Bee class wraps the indivitual
 *
 * @param url URL of a running Bee node
 */
export default class Bee {
  public readonly url: string;

  constructor(url: string) {
    this.url = url;
  }
}

export { File, Tag };
