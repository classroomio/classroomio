import { b as Meta, M as MdxFile, c as Folder } from './types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare function parseFileName(filePath: string): {
    name: string;
    locale: string;
    ext: string;
};
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;
declare function truthy<T>(value: T): value is Truthy<T>;
declare function normalizeMeta(meta: Meta): Exclude<Meta, string>;
declare function normalizePageRoute(parentRoute: string, route: string): string;
declare function pageTitleFromFilename(fileName: string): any;
declare function sortPages(pages: (Pick<MdxFile, 'kind' | 'name' | 'frontMatter' | 'locale'> | Pick<Folder, 'kind' | 'name'>)[], locale?: string): [string, string][];
declare function isSerializable(o: any): boolean;
/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {number} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 */
declare function hashFnv32a(str: string, seed?: number): string;
declare function getDefault<T>(module: T & {
    default?: T;
}): T;

export { getDefault, hashFnv32a, isSerializable, normalizeMeta, normalizePageRoute, pageTitleFromFilename, parseFileName, sortPages, truthy };
