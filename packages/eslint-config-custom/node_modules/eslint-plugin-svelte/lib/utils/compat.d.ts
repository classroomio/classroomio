import type { RuleContext, SourceCode } from '../types';
export declare function getSourceCode(context: RuleContext): SourceCode;
export declare function getFilename(context: RuleContext): string;
export declare function getPhysicalFilename(context: RuleContext): string;
export declare function getCwd(context: RuleContext): string;
