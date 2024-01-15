import { Compression, CompressionData, XHROptions } from './types';
export declare function decideCompression(compressionSupport: Partial<Record<Compression, boolean>>): Compression;
export declare function compressData(compression: Compression, jsonData: string, options: XHROptions): [CompressionData | Uint8Array, XHROptions];
