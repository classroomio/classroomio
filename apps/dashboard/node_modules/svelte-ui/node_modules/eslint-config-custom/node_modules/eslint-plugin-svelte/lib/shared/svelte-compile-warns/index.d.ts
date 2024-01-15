import type { AST } from 'svelte-eslint-parser';
import type { RuleContext } from '../../types';
import type { IgnoreItem } from './ignore-comment';
export type SvelteCompileWarnings = {
    warnings: Warning[];
    unusedIgnores: IgnoreItem[];
    kind: 'warn' | 'error';
    stripStyleElements: AST.SvelteStyleElement[];
};
export type Loc = {
    start?: {
        line: number;
        column: number;
    };
    end?: {
        line: number;
        column: number;
    };
};
export type Warning = {
    code?: string;
    message: string;
} & Loc;
export declare function getSvelteCompileWarnings(context: RuleContext): SvelteCompileWarnings;
