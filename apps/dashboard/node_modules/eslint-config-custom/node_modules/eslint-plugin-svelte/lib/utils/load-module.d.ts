import type { RuleContext } from '../types';
export declare function loadModule<R>(context: RuleContext, name: string): R | null;
export declare function loadModulesForBrowser(): Promise<void>;
