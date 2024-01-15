import type { RuleListener, RuleContext, RuleModule } from '../types';
import type { TSESTree } from '@typescript-eslint/types';
import type { AST as SvAST } from 'svelte-eslint-parser';
export declare function defineWrapperListener(coreRule: RuleModule, context: RuleContext, proxyOptions: {
    createListenerProxy?: (listener: RuleListener) => RuleListener;
}): RuleListener;
export declare function getProxyNode(node: {
    type: string;
}, properties: any): any;
export declare function buildProxyListener(base: RuleListener, convertNode: (node: SvAST.SvelteNode | (TSESTree.Node & {
    parent: SvAST.SvelteNode | TSESTree.Node | null;
})) => any): RuleListener;
export declare function getCoreRule(ruleName: string): RuleModule;
