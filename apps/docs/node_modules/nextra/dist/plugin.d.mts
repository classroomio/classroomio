import { M as MdxFile, F as FileMap, a as PageMapItem } from './types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare const collectMdx: (filePath: string, route?: string) => Promise<MdxFile>;
declare function collectFiles({ dir, locales, route, fileMap, isFollowingSymlink }: {
    dir: string;
    locales?: string[];
    route?: string;
    fileMap?: FileMap;
    isFollowingSymlink?: boolean;
}): Promise<{
    items: PageMapItem[];
    fileMap: FileMap;
}>;

export { collectFiles, collectMdx };
