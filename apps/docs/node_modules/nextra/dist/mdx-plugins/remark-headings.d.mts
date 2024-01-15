import { Root } from 'mdast';
import { Plugin } from 'unified';

declare const remarkHeadings: Plugin<[
    {
        exportName?: string;
        isRemoteContent?: boolean;
    }
], Root>;

export { remarkHeadings };
