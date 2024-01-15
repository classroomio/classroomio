import Component from '../Component';
import Node from './shared/Node';
import Element from './Element';
import Text from './Text';
import Expression from './shared/Expression';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Attribute extends Node {
    type: 'Attribute' | 'Spread';
    start: number;
    end: number;
    scope: TemplateScope;
    component: Component;
    parent: Element;
    name: string;
    is_spread: boolean;
    is_true: boolean;
    is_static: boolean;
    expression?: Expression;
    chunks: Array<Text | Expression>;
    dependencies: Set<string>;
    constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
    get_dependencies(): string[];
    get_value(block: any): import("estree").Property | import("estree").CatchClause | import("estree").ClassDeclaration | import("estree").ClassExpression | import("estree").ClassBody | import("estree").ArrayExpression | import("estree").ArrowFunctionExpression | import("estree").AssignmentExpression | import("estree").AwaitExpression | import("estree").BinaryExpression | import("estree").SimpleCallExpression | import("estree").NewExpression | import("estree").ChainExpression | import("estree").ConditionalExpression | import("estree").FunctionExpression | import("estree").Identifier | import("estree").ImportExpression | import("estree").SimpleLiteral | import("estree").RegExpLiteral | import("estree").BigIntLiteral | import("estree").LogicalExpression | import("estree").MemberExpression | import("estree").MetaProperty | import("estree").ObjectExpression | import("estree").SequenceExpression | import("estree").TaggedTemplateExpression | import("estree").TemplateLiteral | import("estree").ThisExpression | import("estree").UnaryExpression | import("estree").UpdateExpression | import("estree").YieldExpression | import("estree").FunctionDeclaration | import("estree").MethodDefinition | import("estree").ImportDeclaration | import("estree").ExportNamedDeclaration | import("estree").ExportDefaultDeclaration | import("estree").ExportAllDeclaration | import("estree").ImportSpecifier | import("estree").ImportDefaultSpecifier | import("estree").ImportNamespaceSpecifier | import("estree").ExportSpecifier | import("estree").ObjectPattern | import("estree").ArrayPattern | import("estree").RestElement | import("estree").AssignmentPattern | import("estree").PrivateIdentifier | import("estree").Program | import("estree").PropertyDefinition | import("estree").SpreadElement | import("estree").ExpressionStatement | import("estree").BlockStatement | import("estree").StaticBlock | import("estree").EmptyStatement | import("estree").DebuggerStatement | import("estree").WithStatement | import("estree").ReturnStatement | import("estree").LabeledStatement | import("estree").BreakStatement | import("estree").ContinueStatement | import("estree").IfStatement | import("estree").SwitchStatement | import("estree").ThrowStatement | import("estree").TryStatement | import("estree").WhileStatement | import("estree").DoWhileStatement | import("estree").ForStatement | import("estree").ForInStatement | import("estree").ForOfStatement | import("estree").VariableDeclaration | import("estree").Super | import("estree").SwitchCase | import("estree").TemplateElement | import("estree").VariableDeclarator | {
        type: string;
        value: string;
    };
    get_static_value(): string | true;
    should_cache(): boolean;
}
