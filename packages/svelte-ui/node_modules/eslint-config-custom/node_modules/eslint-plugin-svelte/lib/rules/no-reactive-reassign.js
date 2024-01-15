"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const compat_1 = require("../utils/compat");
exports.default = (0, utils_1.createRule)('no-reactive-reassign', {
    meta: {
        docs: {
            description: 'disallow reassigning reactive values',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [
            {
                type: 'object',
                properties: {
                    props: {
                        type: 'boolean'
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            assignmentToReactiveValue: "Assignment to reactive value '{{name}}'.",
            assignmentToReactiveValueProp: "Assignment to property of reactive value '{{name}}'."
        },
        type: 'problem'
    },
    create(context) {
        const props = context.options[0]?.props !== false;
        const sourceCode = (0, compat_1.getSourceCode)(context);
        const scopeManager = sourceCode.scopeManager;
        const globalScope = scopeManager.globalScope;
        const toplevelScope = globalScope?.childScopes.find((scope) => scope.type === 'module') || globalScope;
        if (!globalScope || !toplevelScope) {
            return {};
        }
        const CHECK_REASSIGN = {
            UpdateExpression: ({ parent }) => ({ type: 'reassign', node: parent }),
            UnaryExpression: ({ parent }) => {
                if (parent.operator === 'delete') {
                    return { type: 'reassign', node: parent };
                }
                return null;
            },
            AssignmentExpression: ({ node, parent }) => {
                if (parent.left === node) {
                    return { type: 'reassign', node: parent };
                }
                return null;
            },
            ForInStatement: ({ node, parent }) => {
                if (parent.left === node) {
                    return { type: 'reassign', node: parent };
                }
                return null;
            },
            ForOfStatement: ({ node, parent }) => {
                if (parent.left === node) {
                    return { type: 'reassign', node: parent };
                }
                return null;
            },
            CallExpression: ({ node, parent, pathNodes }) => {
                if (pathNodes.length > 0 && parent.callee === node) {
                    const mem = pathNodes[pathNodes.length - 1];
                    const callName = (0, eslint_utils_1.getPropertyName)(mem);
                    if (callName &&
                        /^(?:push|pop|shift|unshift|reverse|splice|sort|copyWithin|fill)$/u.test(callName)) {
                        return {
                            type: 'reassign',
                            node: parent,
                            pathNodes: pathNodes.slice(0, -1)
                        };
                    }
                }
                return null;
            },
            MemberExpression: ({ node, parent, pathNodes }) => {
                if (parent.object === node) {
                    return {
                        type: 'check',
                        node: parent,
                        pathNodes: [...pathNodes, parent]
                    };
                }
                return null;
            },
            ChainExpression: ({ parent }) => {
                return { type: 'check', node: parent };
            },
            ConditionalExpression: ({ node, parent }) => {
                if (parent.test === node) {
                    return null;
                }
                return { type: 'check', node: parent };
            },
            Property: ({ node, parent }) => {
                if (parent.value === node && parent.parent && parent.parent.type === 'ObjectPattern') {
                    return { type: 'check', node: parent.parent };
                }
                return null;
            },
            ArrayPattern: ({ node, parent }) => {
                if (parent.elements.includes(node)) {
                    return { type: 'check', node: parent };
                }
                return null;
            },
            RestElement: ({ node, parent }) => {
                if (parent.argument === node && parent.parent) {
                    return {
                        type: 'check',
                        node: parent.parent
                    };
                }
                return null;
            },
            SvelteDirective: ({ node, parent }) => {
                if (parent.kind !== 'Binding') {
                    return null;
                }
                if (parent.shorthand || parent.expression === node) {
                    return {
                        type: 'reassign',
                        node: parent
                    };
                }
                return null;
            }
        };
        function getReassignData(expr) {
            let pathNodes = [];
            let node = expr;
            let parent;
            while ((parent = node.parent)) {
                const check = CHECK_REASSIGN[parent.type];
                if (!check) {
                    return null;
                }
                const result = check({ node, parent, pathNodes });
                if (!result) {
                    return null;
                }
                pathNodes = result.pathNodes || pathNodes;
                if (result.type === 'reassign') {
                    return {
                        node: result.node,
                        pathNodes
                    };
                }
                node = result.node;
            }
            return null;
        }
        return {
            SvelteReactiveStatement(node) {
                if (node.body.type !== 'ExpressionStatement' ||
                    node.body.expression.type !== 'AssignmentExpression' ||
                    node.body.expression.operator !== '=') {
                    return;
                }
                const assignment = node.body.expression;
                for (const variable of toplevelScope.variables) {
                    if (!variable.defs.some((def) => def.node === assignment)) {
                        continue;
                    }
                    for (const reference of variable.references) {
                        const id = reference.identifier;
                        if ((assignment.left.range[0] <= id.range[0] &&
                            id.range[1] <= assignment.left.range[1]) ||
                            id.type === 'JSXIdentifier') {
                            continue;
                        }
                        const reassign = getReassignData(id);
                        if (!reassign) {
                            continue;
                        }
                        if (!props && reassign.pathNodes.length > 0)
                            continue;
                        context.report({
                            node: reassign.node,
                            messageId: reassign.pathNodes.length === 0
                                ? 'assignmentToReactiveValue'
                                : 'assignmentToReactiveValueProp',
                            data: {
                                name: id.name
                            }
                        });
                    }
                }
            }
        };
    }
});
