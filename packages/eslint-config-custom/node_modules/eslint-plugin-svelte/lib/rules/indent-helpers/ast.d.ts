import type { AST } from 'svelte-eslint-parser';
import type { TSESTree } from '@typescript-eslint/types';
type AnyToken = AST.Token | AST.Comment;
export declare function isWhitespace(token: AnyToken | TSESTree.Comment | null | undefined): boolean;
export declare function isNotWhitespace(token: AnyToken | TSESTree.Comment | null | undefined): boolean;
export {};
