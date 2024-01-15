import { ProcessorOptions } from '@mdx-js/mdx';
import { GrayMatterFile } from 'gray-matter';
import { Heading as Heading$1 } from 'mdast';
import { NextConfig } from 'next';
import { ReactNode, FC } from 'react';
import { Options } from 'rehype-pretty-code';

declare const MARKDOWN_EXTENSION_REGEX: RegExp;
declare const MARKDOWN_URL_EXTENSION_REGEX: RegExp;
declare const IS_PRODUCTION: boolean;
declare const LOCALE_REGEX: RegExp;
declare const DEFAULT_LOCALE = "en-US";
declare const DEFAULT_CONFIG: Omit<NextraConfig, 'theme'>;
declare const OFFICIAL_THEMES: string[];
declare const META_FILENAME = "_meta.json";
declare const DYNAMIC_META_FILENAME = "_meta.js";
declare const CWD: string;
declare const MARKDOWN_EXTENSIONS: readonly ["md", "mdx"];
declare const PUBLIC_DIR: string;
declare const EXTERNAL_URL_REGEX: RegExp;
declare const NEXTRA_INTERNAL: unique symbol;
declare const CODE_BLOCK_FILENAME_REGEX: RegExp;
declare const DEFAULT_LOCALES: string[];
declare const ERROR_ROUTES: Set<string>;

type PageMapProps = {
    filePath: string;
    items: PageMapItem[];
    fileMap: FileMap;
    defaultLocale: string;
};
declare function getDynamicMeta(path: string, items: PageMapItem[], locale?: string): [DynamicMetaDescriptor[], PageMapItem[]];
declare function resolvePageMap({ filePath, items, fileMap, defaultLocale }: PageMapProps): {
    route: string;
    pageMap: PageMapItem[];
    dynamicMetaItems: DynamicMetaDescriptor[];
};
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
declare const pageMapCache: PageMapCache;

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

export { FrontMatter as A, MetaJsonPath as B, CWD as C, DEFAULT_LOCALE as D, EXTERNAL_URL_REGEX as E, FileMap as F, MdxPath as G, Heading as H, IS_PRODUCTION as I, PageOpts as J, Nextra as K, LoaderOptions as L, MdxFile as M, NextraConfig as N, OFFICIAL_THEMES as O, Page as P, NextraThemeLayoutProps as Q, ReadingTime as R, StructurizedData as S, ThemeConfig as T, NextraInternalGlobal as U, DynamicMetaDescriptor as V, SearchData as W, PageMapItem as a, Meta as b, Folder as c, Flexsearch as d, MARKDOWN_EXTENSION_REGEX as e, MARKDOWN_URL_EXTENSION_REGEX as f, LOCALE_REGEX as g, DEFAULT_CONFIG as h, META_FILENAME as i, DYNAMIC_META_FILENAME as j, MARKDOWN_EXTENSIONS as k, PUBLIC_DIR as l, NEXTRA_INTERNAL as m, CODE_BLOCK_FILENAME_REGEX as n, DEFAULT_LOCALES as o, ERROR_ROUTES as p, getDynamicMeta as q, resolvePageMap as r, PageMapCache as s, pageMapCache as t, nextra as u, MetaJsonFile as v, DynamicFolder as w, DynamicMetaItem as x, DynamicMeta as y, DynamicMetaJsonFile as z };
