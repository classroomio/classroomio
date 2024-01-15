import type { SvelteNodeListener } from '../../types-for-node';
import type { IndentContext } from './commons';
type NodeListener = SvelteNodeListener;
export declare function defineVisitor(context: IndentContext): NodeListener;
export {};
