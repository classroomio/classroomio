import type { AST } from 'svelte-eslint-parser';
import type { RuleContext } from '../../types';
import type { ASTNodeWithParent } from '../../types-for-node';
export declare function extractLeadingComments(context: RuleContext, node: ASTNodeWithParent): (AST.Token | AST.Comment)[];
