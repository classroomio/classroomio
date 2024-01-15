import type { ASTNode, SourceCode } from '../../types';
import type { AnyToken, IndentOptions, MaybeNode } from './commons';
declare const enum OffsetDataType {
    normal = 0,
    align = 1,
    start = 2
}
type OffsetData = {
    type: OffsetDataType.normal;
    base: number;
    offset: number;
    expectedIndent?: number;
} | {
    type: OffsetDataType.align;
    base: number;
    alignIndent: number;
    expectedIndent?: number;
} | {
    type: OffsetDataType.start;
    offset: number;
    expectedIndent?: number;
};
export declare class OffsetContext {
    private readonly sourceCode;
    private readonly options;
    private readonly offsets;
    private readonly ignoreRanges;
    constructor(arg: {
        sourceCode: SourceCode;
        options: IndentOptions;
    });
    setOffsetIndex(index: number, offset: number, base: number): void;
    private setAlignIndent;
    setOffsetToken(token: AnyToken | null | undefined | (AnyToken | null | undefined)[], offset: number, baseToken: AnyToken): void;
    copyOffset(index: number, srcIndex: number): void;
    setStartOffsetIndex(index: number, offset: number): void;
    setStartOffsetToken(token: AnyToken | null | undefined | (AnyToken | null | undefined)[], offset: number): void;
    setOffsetElementList(nodes: (ASTNode | AnyToken | MaybeNode | null | undefined)[], baseNodeOrToken: ASTNode | AnyToken | MaybeNode, lastNodeOrToken: ASTNode | AnyToken | MaybeNode | null, offset: number, align?: boolean): void;
    private _setOffsetElementList;
    ignore(node: ASTNode): void;
    getOffsetCalculator(): OffsetCalculator;
}
export declare class OffsetCalculator {
    private readonly options;
    private readonly offsets;
    private readonly ignoreRanges;
    constructor(arg: {
        offsets: Map<number, OffsetData>;
        options: IndentOptions;
        ignoreRanges: [number, number][];
    });
    private getExpectedIndentFromIndex;
    getExpectedIndentFromToken(token: AnyToken): number | null;
    getExpectedIndentFromTokens(tokens: AnyToken[]): null | number;
    saveExpectedIndent(tokens: AnyToken[], expectedIndent: number): void;
}
export {};
