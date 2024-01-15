import type { Linter } from 'eslint';
export * as meta from '../meta';
export declare function preprocess(code: string, filename: string): string[];
export declare function postprocess([messages]: Linter.LintMessage[][], filename: string): Linter.LintMessage[];
export declare const supportsAutofix = true;
