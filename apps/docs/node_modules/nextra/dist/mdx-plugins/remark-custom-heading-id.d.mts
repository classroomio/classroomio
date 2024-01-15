import { Root } from 'mdast';
import { Plugin } from 'unified';

type HProperties = {
    id?: string;
};
declare const remarkCustomHeadingId: Plugin<[], Root>;

export { HProperties, remarkCustomHeadingId };
