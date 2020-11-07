import { Tag } from '../types';
/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export declare function createTag(url: string): Promise<Tag>;
/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param tag UID or tag object to be retrieved
 */
export declare function retrieveTag(url: string, tag: Tag | number): Promise<Tag>;
