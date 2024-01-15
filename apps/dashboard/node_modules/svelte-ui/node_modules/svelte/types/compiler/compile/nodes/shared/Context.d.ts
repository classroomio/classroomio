import { Node, Identifier, Expression, PrivateIdentifier, Pattern } from 'estree';
import Component from '../../Component';
import TemplateScope from './TemplateScope';
export declare type Context = DestructuredVariable | ComputedProperty;
interface ComputedProperty {
    type: 'ComputedProperty';
    property_name: Identifier;
    key: Expression | PrivateIdentifier;
}
interface DestructuredVariable {
    type: 'DestructuredVariable';
    key: Identifier;
    name?: string;
    modifier: (node: Node) => Node;
    default_modifier: (node: Node, to_ctx: (name: string) => Node) => Node;
}
export declare function unpack_destructuring({ contexts, node, modifier, default_modifier, scope, component, context_rest_properties, in_rest_element }: {
    contexts: Context[];
    node: Pattern;
    modifier?: DestructuredVariable['modifier'];
    default_modifier?: DestructuredVariable['default_modifier'];
    scope: TemplateScope;
    component: Component;
    context_rest_properties: Map<string, Node>;
    in_rest_element?: boolean;
}): void;
export {};
