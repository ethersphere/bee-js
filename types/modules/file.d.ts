/// <reference types="node" />
import { Readable } from 'stream';
import { OptionsUpload } from '../types';
/**
 * Upload single file to a Bee node
 *
 * @param url     Bee file URL
 * @param data    Data to be uploaded
 * @param options Aditional options like tag, encryption, pinning
 */
export declare function upload(url: string, data: string | Buffer | Readable, options?: OptionsUpload): Promise<string>;
/**
 * Download single file as a buffer
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export declare function download(url: string, hash: string): Promise<Buffer>;
/**
 * Download single file as a readable stream
 *
 * @param url  Bee file URL
 * @param hash Bee file hash
 */
export declare function downloadReadable(url: string, hash: string): Promise<Readable>;
