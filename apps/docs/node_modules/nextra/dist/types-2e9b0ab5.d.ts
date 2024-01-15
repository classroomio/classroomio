import { GrayMatterFile } from 'gray-matter';
import { Heading as Heading$1 } from 'mdast';

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
type PageMapItem = Folder | MdxFile | MetaJsonFile;
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
type ThemeConfig = any | null;
type DynamicMetaDescriptor = {
    metaFilePath: string;
    metaObjectKeyPath: string;
    metaParentKeyPath: string;
};

export { DynamicMetaJsonFile as D, Folder as F, MdxFile as M, PageMapItem as P, ThemeConfig as T, PageOpts as a, DynamicMetaDescriptor as b };
