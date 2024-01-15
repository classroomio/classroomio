import type { IndentContext } from './commons';
import type { TSNodeListener } from '../../types-for-node';
type NodeListener = TSNodeListener;
export declare function defineVisitor(context: IndentContext): NodeListener;
export {};
