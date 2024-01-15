"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const ast_utils_1 = require("../utils/ast-utils");
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const DOM_MANIPULATING_METHODS = new Set([
    'appendChild',
    'insertBefore',
    'normalize',
    'removeChild',
    'replaceChild',
    'after',
    'append',
    'before',
    'insertAdjacentElement',
    'insertAdjacentHTML',
    'insertAdjacentText',
    'prepend',
    'remove',
    'replaceChildren',
    'replaceWith'
]);
const DOM_MANIPULATING_PROPERTIES = new Set([
    'textContent',
    'innerHTML',
    'outerHTML',
    'innerText',
    'outerText'
]);
exports.default = (0, utils_1.createRule)('no-dom-manipulating', {
    meta: {
        docs: {
            description: 'disallow DOM manipulating',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [],
        messages: {
            disallowManipulateDOM: "Don't manipulate the DOM directly. The Svelte runtime can get confused if there is a difference between the actual DOM and the DOM expected by the Svelte runtime."
        },
        type: 'problem'
    },
    create(context) {
        const domVariables = new Set();
        function verifyIdentifier(node) {
            const member = node.parent;
            if (member?.type !== 'MemberExpression' || member.object !== node) {
                return;
            }
            const name = (0, eslint_utils_1.getPropertyName)(member);
            if (!name) {
                return;
            }
            let target = member;
            let parent = target.parent;
            while (parent?.type === 'ChainExpression') {
                target = parent;
                parent = parent.parent;
            }
            if (!parent) {
                return;
            }
            if (parent.type === 'CallExpression') {
                if (parent.callee !== target || !DOM_MANIPULATING_METHODS.has(name)) {
                    return;
                }
            }
            else if (parent.type === 'AssignmentExpression') {
                if (parent.left !== target || !DOM_MANIPULATING_PROPERTIES.has(name)) {
                    return;
                }
            }
            else {
                return;
            }
            context.report({
                node: member,
                messageId: 'disallowManipulateDOM'
            });
        }
        return {
            "SvelteDirective[kind='Binding']"(node) {
                if (node.key.name.name !== 'this' ||
                    !node.expression ||
                    node.expression.type !== 'Identifier') {
                    return;
                }
                const element = node.parent.parent;
                if (element.type !== 'SvelteElement' || !isHTMLElement(element)) {
                    return;
                }
                const variable = (0, ast_utils_1.findVariable)(context, node.expression);
                if (!variable || (variable.scope.type !== 'module' && variable.scope.type !== 'global')) {
                    return;
                }
                domVariables.add(variable);
            },
            'Program:exit'() {
                for (const variable of domVariables) {
                    for (const reference of variable.references) {
                        verifyIdentifier(reference.identifier);
                    }
                }
            }
        };
        function isHTMLElement(node) {
            return (node.kind === 'html' || (node.kind === 'special' && (0, ast_utils_1.getNodeName)(node) === 'svelte:element'));
        }
    }
});
