"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const svelte_store_1 = require("./reference-helpers/svelte-store");
const compat_1 = require("../utils/compat");
exports.default = (0, utils_1.createRule)('require-store-reactive-access', {
    meta: {
        docs: {
            description: 'disallow to use of the store itself as an operand. Need to use $ prefix or get function.',
            category: 'Possible Errors',
            recommended: false
        },
        fixable: 'code',
        schema: [],
        messages: {
            usingRawStoreInText: 'Use the $ prefix or the get function to access reactive values instead of accessing the raw store.'
        },
        type: 'problem'
    },
    create(context) {
        if (!(0, compat_1.getSourceCode)(context).parserServices.isSvelte) {
            return {};
        }
        const isStore = (0, svelte_store_1.createStoreChecker)(context);
        function verifyExpression(node, options) {
            if (!node)
                return;
            if (isStore(node, { consistent: options?.consistent })) {
                context.report({
                    node,
                    messageId: 'usingRawStoreInText',
                    fix: node.type === 'Identifier' && !options?.disableFix
                        ? (fixer) => fixer.insertTextBefore(node, '$')
                        : null
                });
            }
        }
        return {
            SvelteMustacheTag(node) {
                if (canAcceptStoreMustache(node)) {
                    return;
                }
                verifyExpression(node.expression);
            },
            SvelteShorthandAttribute(node) {
                if (canAcceptStoreAttributeElement(node.parent.parent)) {
                    return;
                }
                verifyExpression(node.value, { disableFix: true });
            },
            SvelteSpreadAttribute(node) {
                verifyExpression(node.argument);
            },
            SvelteDirective(node) {
                if (node.kind === 'Action' || node.kind === 'Animation' || node.kind === 'Transition') {
                    if (node.key.name.type !== 'Identifier') {
                        return;
                    }
                    verifyExpression(node.key.name);
                }
                else if (node.kind === 'Binding') {
                    if (node.key.name.name !== 'this' && canAcceptStoreAttributeElement(node.parent.parent)) {
                        return;
                    }
                    verifyExpression(node.expression, {
                        disableFix: node.shorthand
                    });
                }
                else if (node.kind === 'Class') {
                    verifyExpression(node.expression, {
                        disableFix: node.shorthand,
                        consistent: true
                    });
                }
                else if (node.kind === 'EventHandler') {
                    verifyExpression(node.expression);
                }
            },
            SvelteStyleDirective(node) {
                if (node.shorthand && node.key.name.type === 'Identifier') {
                    verifyExpression(node.key.name, {
                        disableFix: true
                    });
                }
            },
            SvelteSpecialDirective(node) {
                if (node.kind === 'this') {
                    verifyExpression(node.expression);
                }
            },
            'SvelteIfBlock, SvelteAwaitBlock'(node) {
                verifyExpression(node.expression, {
                    consistent: true
                });
            },
            SvelteEachBlock(node) {
                verifyExpression(node.expression);
            },
            ['IfStatement, WhileStatement, DoWhileStatement, ConditionalExpression, ForStatement'](node) {
                verifyExpression(node.test, {
                    consistent: true
                });
            },
            'ForInStatement, ForOfStatement'(node) {
                verifyExpression(node.right);
            },
            SwitchStatement(node) {
                verifyExpression(node.discriminant);
            },
            'CallExpression, NewExpression'(node) {
                if (node.callee.type === 'Super') {
                    return;
                }
                verifyExpression(node.callee);
            },
            UnaryExpression(node) {
                verifyExpression(node.argument, {
                    consistent: node.operator === '!' || node.operator === 'typeof'
                });
            },
            'UpdateExpression, SpreadElement'(node) {
                verifyExpression(node.argument);
            },
            AssignmentExpression(node) {
                if (node.operator !== '=') {
                    if (node.left.type !== 'ObjectPattern' && node.left.type !== 'ArrayPattern') {
                        verifyExpression(node.left);
                    }
                    verifyExpression(node.right);
                }
            },
            BinaryExpression(node) {
                if (node.left.type !== 'PrivateIdentifier') {
                    verifyExpression(node.left, {
                        consistent: node.operator === '==' ||
                            node.operator === '!=' ||
                            node.operator === '===' ||
                            node.operator === '!=='
                    });
                }
                verifyExpression(node.right, {
                    consistent: node.operator === '==' ||
                        node.operator === '!=' ||
                        node.operator === '===' ||
                        node.operator === '!=='
                });
            },
            LogicalExpression(node) {
                verifyExpression(node.left, {
                    consistent: true
                });
            },
            TemplateLiteral(node) {
                for (const expr of node.expressions) {
                    verifyExpression(expr);
                }
            },
            TaggedTemplateExpression(node) {
                verifyExpression(node.tag);
            },
            'Property, PropertyDefinition, MethodDefinition'(node) {
                if (node.key.type === 'PrivateIdentifier' || !node.computed) {
                    return;
                }
                verifyExpression(node.key);
            },
            ImportExpression(node) {
                verifyExpression(node.source);
            },
            AwaitExpression(node) {
                verifyExpression(node.argument, {
                    consistent: true
                });
            }
        };
        function canAcceptStoreMustache(node) {
            if (node.parent.type !== 'SvelteAttribute') {
                return false;
            }
            const attr = node.parent;
            if (attr.value.length > 1) {
                return false;
            }
            if (attr.key.name.startsWith('--')) {
                return false;
            }
            const element = attr.parent.parent;
            return canAcceptStoreAttributeElement(element);
        }
        function canAcceptStoreAttributeElement(node) {
            if (node.type !== 'SvelteElement') {
                return false;
            }
            if (node.kind === 'html' ||
                (node.kind === 'special' && node.name.name === 'svelte:element')) {
                return false;
            }
            return true;
        }
    }
});
