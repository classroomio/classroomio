import type { ASTNode, RuleContext, SourceCode } from '../types';
import type { TSESTree } from '@typescript-eslint/types';
import type { Scope, Variable } from '@typescript-eslint/scope-manager';
import type { AST as SvAST } from 'svelte-eslint-parser';
export declare function equalTokens(left: ASTNode, right: ASTNode, sourceCode: SourceCode): boolean;
export declare function getStringIfConstant(node: TSESTree.Expression | TSESTree.PrivateIdentifier): string | null;
export declare function needParentheses(node: TSESTree.Expression, kind: 'not' | 'logical'): boolean;
export declare function isHTMLElementLike(node: SvAST.SvelteElement | SvAST.SvelteScriptElement | SvAST.SvelteStyleElement): node is SvAST.SvelteHTMLElement | (SvAST.SvelteSpecialElement & {
    name: SvAST.SvelteName & {
        name: 'svelte:element';
    };
});
export declare function findAttribute<N extends string>(node: SvAST.SvelteElement | SvAST.SvelteScriptElement | SvAST.SvelteStyleElement | SvAST.SvelteStartTag, name: N): (SvAST.SvelteAttribute & {
    key: SvAST.SvelteAttribute['key'] & {
        name: N;
    };
}) | null;
export declare function findShorthandAttribute<N extends string>(node: SvAST.SvelteElement | SvAST.SvelteScriptElement | SvAST.SvelteStyleElement | SvAST.SvelteStartTag, name: N): (SvAST.SvelteShorthandAttribute & {
    key: SvAST.SvelteShorthandAttribute['key'] & {
        name: N;
    };
}) | null;
export declare function findBindDirective<N extends string>(node: SvAST.SvelteElement | SvAST.SvelteScriptElement | SvAST.SvelteStyleElement | SvAST.SvelteStartTag, name: N): (SvAST.SvelteBindingDirective & {
    key: SvAST.SvelteDirectiveKey & {
        name: SvAST.SvelteDirectiveKey['name'] & {
            name: N;
        };
    };
}) | null;
export declare function getStaticAttributeValue(node: SvAST.SvelteAttribute): string | null;
export declare function getLangValue(node: SvAST.SvelteScriptElement | SvAST.SvelteStyleElement): string | null;
export declare function findVariable(context: RuleContext, node: TSESTree.Identifier): Variable | null;
export declare function iterateIdentifiers(node: TSESTree.DestructuringPattern): Iterable<TSESTree.Identifier>;
export declare function getScope(context: RuleContext, currentNode: TSESTree.Node): Scope;
export declare function getParent(node: TSESTree.Node): TSESTree.Node | null;
export type QuoteAndRange = {
    quote: 'unquoted' | 'double' | 'single';
    range: [number, number];
    firstToken: SvAST.Token | SvAST.Comment;
    lastToken: SvAST.Token | SvAST.Comment;
};
export declare function getAttributeValueQuoteAndRange(attr: SvAST.SvelteAttribute | SvAST.SvelteDirective | SvAST.SvelteStyleDirective | SvAST.SvelteSpecialDirective, sourceCode: SourceCode): QuoteAndRange | null;
export declare function getMustacheTokens(node: SvAST.SvelteMustacheTag | SvAST.SvelteShorthandAttribute | SvAST.SvelteSpreadAttribute | SvAST.SvelteDebugTag, sourceCode: SourceCode): {
    openToken: SvAST.Token;
    closeToken: SvAST.Token;
};
export declare function getMustacheTokens(node: SvAST.SvelteDirective | SvAST.SvelteSpecialDirective | SvAST.SvelteMustacheTag | SvAST.SvelteShorthandAttribute | SvAST.SvelteSpreadAttribute | SvAST.SvelteDebugTag, sourceCode: SourceCode): {
    openToken: SvAST.Token;
    closeToken: SvAST.Token;
} | null;
export declare function getAttributeKeyText(node: SvAST.SvelteAttribute | SvAST.SvelteShorthandAttribute | SvAST.SvelteStyleDirective | SvAST.SvelteDirective | SvAST.SvelteSpecialDirective, context: RuleContext): string;
export declare function getDirectiveName(node: SvAST.SvelteDirective): string;
export declare function getNodeName(node: SvAST.SvelteElement): string;
export declare function isVoidHtmlElement(node: SvAST.SvelteElement): boolean;
export declare function isExpressionIdentifier(node: TSESTree.Identifier): boolean;
