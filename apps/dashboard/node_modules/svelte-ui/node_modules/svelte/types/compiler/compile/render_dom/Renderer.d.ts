import Block from './Block';
import { CompileOptions, Var } from '../../interfaces';
import Component from '../Component';
import FragmentWrapper from './wrappers/Fragment';
import { Node, Identifier, MemberExpression, Literal, Expression, UnaryExpression, ArrayExpression } from 'estree';
interface ContextMember {
    name: string;
    index: Literal;
    is_contextual: boolean;
    is_non_contextual: boolean;
    variable: Var;
    priority: number;
}
export interface BindingGroup {
    binding_group: (to_reference?: boolean) => Node;
    contexts: string[];
    list_dependencies: Set<string>;
    keypath: string;
    add_element: (block: Block, element: Identifier) => void;
    render: (block: Block) => void;
}
export default class Renderer {
    component: Component;
    options: CompileOptions;
    context: ContextMember[];
    initial_context: ContextMember[];
    context_lookup: Map<string, ContextMember>;
    context_overflow: boolean;
    blocks: Array<Block | Node | Node[]>;
    readonly: Set<string>;
    meta_bindings: Array<Node | Node[]>;
    binding_groups: Map<string, BindingGroup>;
    block: Block;
    fragment: FragmentWrapper;
    file_var: Identifier;
    locate: (c: number) => {
        line: number;
        column: number;
    };
    constructor(component: Component, options: CompileOptions);
    add_to_context(name: string, contextual?: boolean): ContextMember;
    invalidate(name: string, value?: unknown, main_execution_context?: boolean): unknown;
    dirty(names: string[], is_reactive_declaration?: boolean): Expression;
    get_initial_dirty(): UnaryExpression | ArrayExpression;
    reference(node: string | Identifier | MemberExpression, ctx?: string | void): any;
    remove_block(block: Block | Node | Node[]): void;
}
export {};
