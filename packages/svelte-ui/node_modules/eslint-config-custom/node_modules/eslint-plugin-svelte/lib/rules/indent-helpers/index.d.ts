import type { RuleContext, RuleListener } from '../../types';
import type { IndentOptions } from './commons';
export declare function defineVisitor(context: RuleContext, defaultOptions: Partial<IndentOptions>): RuleListener;
