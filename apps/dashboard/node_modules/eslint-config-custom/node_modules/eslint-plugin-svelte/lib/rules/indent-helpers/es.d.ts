import type { IndentContext } from './commons';
import type { ESNodeListener } from '../../types-for-node';
type NodeListener = ESNodeListener;
export declare function defineVisitor(context: IndentContext): NodeListener;
export {};
