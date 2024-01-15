import type { AST } from 'svelte-eslint-parser';
import type { RuleContext } from '../../../types';
import type { TransformResult } from './types';
export declare function transform(node: AST.SvelteScriptElement, text: string, context: RuleContext): TransformResult | null;
export declare function hasBabel(context: RuleContext): boolean;
