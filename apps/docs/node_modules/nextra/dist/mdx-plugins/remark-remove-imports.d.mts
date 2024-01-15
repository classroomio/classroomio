import { Root } from 'mdast';
import { Plugin } from 'unified';

declare const remarkRemoveImports: Plugin<[], Root>;

export { remarkRemoveImports };
