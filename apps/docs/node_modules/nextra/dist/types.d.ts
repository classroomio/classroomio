import { ProcessorOptions } from '@mdx-js/mdx';
import { GrayMatterFile } from 'gray-matter';
import { Heading as Heading$1 } from 'mdast';
import { NextConfig } from 'next';
import { ReactNode, FC } from 'react';
import { Options } from 'rehype-pretty-code';

declare const META_FILENAME = "_meta.json";
declare const MARKDOWN_EXTENSIONS: readonly ["md", "mdx"];
declare const NEXTRA_INTERNAL: unique symbol;

declare class PageMapCache {
    cache: {
        items: PageMapItem[];
        fileMap: FileMap;
    } | null;
    set(data: {
        items: PageMapItem[];
        fileMap: FileMap;
    }): void;
    clear(): void;
    get(): {
        items: PageMapItem[];
        fileMap: FileMap;
    } | null;
}

type MetaFilename = typeof META_FILENAME;
type MarkdownExtension = (typeof MARKDOWN_EXTENSIONS)[number];
interface LoaderOptions extends NextraConfig {
    isMetaImport?: boolean;
    isPageImport?: boolean;
    locales: string[];
    defaultLocale: string;
    pageMapCache: PageMapCache;
    newNextLinkBehavior?: boolean;
}
interface Folder<FileType = PageMapItem> {
    kind: 'Folder';
    name: string;
    route: string;
    children: FileType[];
}
type MetaJsonFile = {
    kind: 'Meta';
    locale?: string;
    data: {
        [fileName: string]: Meta;
    };
    __nextra_src?: string;
};
type DynamicFolder = {
    type: 'folder';
    items: DynamicMeta;
    title?: string;
};
type DynamicMetaItem = Meta | DynamicFolder;
type DynamicMeta = Record<string, DynamicMetaItem>;
type DynamicMetaJsonFile = {
    kind: 'Meta';
    locale?: string;
    data: DynamicMeta;
};
type FrontMatter = GrayMatterFile<string>['data'];
type Meta = string | Record<string, any>;
type MdxFile<FrontMatterType = FrontMatter> = {
    kind: 'MdxPage';
    name: string;
    route: string;
    locale?: string;
    frontMatter?: FrontMatterType;
};
type MetaJsonPath = `${string}/${MetaFilename}`;
type MdxPath = `${string}.${MarkdownExtension}`;
type FileMap = {
    [jsonPath: MetaJsonPath]: MetaJsonFile;
    [mdxPath: MdxPath]: MdxFile;
};
type PageMapItem = Folder | MdxFile | MetaJsonFile;
type Page = (MdxFile | Folder<Page>) & {
    meta?: Exclude<Meta, string>;
};
type Heading = {
    depth: Heading$1['depth'];
    value: string;
    id: string;
};
type PageOpts<FrontMatterType = FrontMatter> = {
    filePath: string;
    route: string;
    frontMatter: FrontMatterType;
    pageMap: PageMapItem[];
    title: string;
    headings: Heading[];
    hasJsxInH1?: boolean;
    timestamp?: number;
    flexsearch?: Flexsearch;
    newNextLinkBehavior?: boolean;
    readingTime?: ReadingTime;
};
type ReadingTime = {
    text: string;
    minutes: number;
    time: number;
    words: number;
};
type Theme = string;
type Flexsearch = boolean | {
    /**
     * Whether to index code blocks
     * @default true
     */
    codeblocks: boolean;
    /**
     * A filter function to filter out files from indexing, and return the
     * index file key, or null to skip indexing.
     * A site can have multiple indexes, by default they're separated by
     * locales as multiple index files.
     */
    indexKey?: (filepath: string, route: string, locale?: string) => null | string;
};
type Transform = (result: string, options: {
    route: string;
}) => string | Promise<string>;
type NextraConfig = {
    theme: Theme;
    themeConfig?: string;
    defaultShowCopyCode?: boolean;
    flexsearch?: Flexsearch;
    staticImage?: boolean;
    readingTime?: boolean;
    latex?: boolean;
    codeHighlight?: boolean;
    /**
     * A function to modify the code of compiled MDX pages.
     * @experimental
     */
    transform?: Transform;
    /**
     * A function to modify the `pageOpts` prop passed to theme layouts.
     * @experimental
     */
    transformPageOpts?: (pageOpts: PageOpts) => PageOpts;
    mdxOptions?: Pick<ProcessorOptions, 'rehypePlugins' | 'remarkPlugins'> & {
        format?: 'detect' | 'mdx' | 'md';
        rehypePrettyCodeOptions?: Partial<Options>;
    };
};
type Nextra = (...args: [NextraConfig] | [theme: Theme, themeConfig: string]) => (nextConfig: NextConfig) => NextConfig;
declare const nextra: Nextra;

type ThemeConfig = any | null;
type NextraThemeLayoutProps = {
    pageOpts: PageOpts;
    pageProps: any;
    themeConfig: ThemeConfig;
    children: ReactNode;
};
type NextraInternalGlobal = typeof globalThis & {
    [NEXTRA_INTERNAL]: {
        pageMap: PageMapItem[];
        route: string;
        context: Record<string, {
            Content: FC;
            pageOpts: PageOpts;
            themeConfig: ThemeConfig;
        }>;
        refreshListeners: Record<string, (() => void)[]>;
        Layout: FC<any>;
        themeConfig?: ThemeConfig;
        flexsearch?: Flexsearch;
    };
};
type DynamicMetaDescriptor = {
    metaFilePath: string;
    metaObjectKeyPath: string;
    metaParentKeyPath: string;
};
type StructurizedData = Record<string, string>;
type SearchData = {
    [route: string]: {
        title: string;
        data: StructurizedData;
    };
};

export { DynamicFolder, DynamicMeta, DynamicMetaDescriptor, DynamicMetaItem, DynamicMetaJsonFile, FileMap, Flexsearch, Folder, FrontMatter, Heading, LoaderOptions, MdxFile, MdxPath, Meta, MetaJsonFile, MetaJsonPath, Nextra, NextraConfig, NextraInternalGlobal, NextraThemeLayoutProps, Page, PageMapItem, PageOpts, ReadingTime, SearchData, StructurizedData, ThemeConfig, nextra as default };
