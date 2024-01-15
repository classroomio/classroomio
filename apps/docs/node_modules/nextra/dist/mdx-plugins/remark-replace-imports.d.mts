import { Root } from 'mdast';
import { Plugin } from 'unified';

/**
 * Markdown files that imported outside CWD could not find `nextra/mdx` or `next/image`
 * to fix it we need to replace import path with absolute for them
 * https://github.com/shuding/nextra/issues/1303
 */
declare const remarkReplaceImports: Plugin<[], Root>;

export { remarkReplaceImports };
