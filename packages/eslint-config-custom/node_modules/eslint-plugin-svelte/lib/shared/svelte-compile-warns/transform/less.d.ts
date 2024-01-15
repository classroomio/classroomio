import type { AST } from 'svelte-eslint-parser';
import type { RuleContext } from '../../../types';
import type { TransformResult } from './types';
export declare function transform(node: AST.SvelteStyleElement, text: string, context: RuleContext): TransformResult | null;
