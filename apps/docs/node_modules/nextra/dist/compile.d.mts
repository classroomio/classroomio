import { ProcessorOptions } from '@mdx-js/mdx';
import { S as StructurizedData, R as ReadingTime, L as LoaderOptions } from './types-c8e621b7.js';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

type MdxOptions = LoaderOptions['mdxOptions'] & Pick<ProcessorOptions, 'jsx' | 'outputFormat'>;
type CompileMdxOptions = Pick<LoaderOptions, 'staticImage' | 'flexsearch' | 'defaultShowCopyCode' | 'readingTime' | 'latex' | 'codeHighlight'> & {
    mdxOptions?: MdxOptions;
    route?: string;
    locale?: string;
    filePath?: string;
    useCachedCompiler?: boolean;
    isPageImport?: boolean;
};
declare function compileMdx(source: string, { staticImage, flexsearch, readingTime, latex, codeHighlight, defaultShowCopyCode, route, locale, mdxOptions, filePath, useCachedCompiler, isPageImport }?: CompileMdxOptions): Promise<{
    frontMatter: {
        [key: string]: any;
    };
    headings?: unknown;
    searchIndexKey?: string | undefined;
    structurizedData?: StructurizedData | undefined;
    readingTime?: ReadingTime | undefined;
    hasJsxInH1?: true | undefined;
    title?: string | undefined;
    result: string;
}>;

export { compileMdx };
