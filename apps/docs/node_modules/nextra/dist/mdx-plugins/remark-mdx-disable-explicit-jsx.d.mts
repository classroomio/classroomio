import { Root } from 'mdast';
import { Plugin } from 'unified';

declare const remarkMdxDisableExplicitJsx: Plugin<[
    {
        whiteList: string[];
    }
], Root>;

export { remarkMdxDisableExplicitJsx };
