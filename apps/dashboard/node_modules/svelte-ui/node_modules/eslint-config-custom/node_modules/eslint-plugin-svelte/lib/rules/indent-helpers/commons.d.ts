import type { ASTNode, SourceCode } from '../../types';
import type { AST } from 'svelte-eslint-parser';
import type { OffsetContext } from './offset-context';
export type AnyToken = AST.Token | AST.Comment;
export type MaybeNode = {
    type: string;
    range: [number, number];
    loc: AST.SourceLocation;
};
export type IndentOptions = {
    indentChar: ' ' | '\t';
    indentScript: boolean;
    indentSize: number;
    switchCase: number;
    alignAttributesVertically: boolean;
    ignoredNodes: string[];
};
export type IndentContext = {
    sourceCode: SourceCode;
    options: IndentOptions;
    offsets: OffsetContext;
};
export declare function getFirstAndLastTokens(sourceCode: SourceCode, node: ASTNode | AnyToken | MaybeNode, borderOffset?: number): {
    firstToken: AST.Token;
    lastToken: AST.Token;
};
export declare function isBeginningOfLine(sourceCode: SourceCode, node: ASTNode | AnyToken | MaybeNode): boolean;
export declare function isBeginningOfElement(node: AST.SvelteText): boolean;
