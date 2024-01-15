import { Root } from 'mdast';
import { Plugin } from 'unified';

type RemarkLinkRewriteOptions = {
    pattern: RegExp;
    replace: string;
    excludeExternalLinks?: boolean;
};
declare const remarkLinkRewrite: Plugin<[RemarkLinkRewriteOptions], Root>;

export { RemarkLinkRewriteOptions, remarkLinkRewrite };
