import { a as PageMapItem } from './types-c8e621b7.js';
import { compileMdx } from './compile.mjs';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare function buildDynamicMDX(content: string, compileMdxOptions: Parameters<typeof compileMdx>[1]): Promise<{
    __nextra_dynamic_mdx: string;
    __nextra_dynamic_opts: string;
}>;
declare function buildDynamicMeta(): Promise<{
    __nextra_pageMap: PageMapItem[];
}>;

export { buildDynamicMDX, buildDynamicMeta };
