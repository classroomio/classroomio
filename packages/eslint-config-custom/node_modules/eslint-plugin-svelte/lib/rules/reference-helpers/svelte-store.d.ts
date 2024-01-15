import type { TSESTree } from '@typescript-eslint/types';
import type { RuleContext } from '../../types';
type StoreName = 'writable' | 'readable' | 'derived';
export declare function extractStoreReferences(context: RuleContext, storeNames?: StoreName[]): Generator<{
    node: TSESTree.CallExpression;
    name: string;
}, void>;
export type StoreChecker = (node: TSESTree.Expression, options?: {
    consistent?: boolean;
}) => boolean;
export declare function createStoreChecker(context: RuleContext): StoreChecker;
export {};
