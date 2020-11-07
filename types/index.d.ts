import * as File from './modules/file';
import * as Tag from './modules/tag';
/**
 * The Bee class wraps the indivitual
 *
 * @param url URL of a running Bee node
 */
export default class Bee {
    readonly url: string;
    constructor(url: string);
}
export { File, Tag };
