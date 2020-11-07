/// <reference types="node" />
import { Readable } from 'stream';
export declare function prepareData(data: string | Buffer | Readable): Promise<Buffer | Readable>;
