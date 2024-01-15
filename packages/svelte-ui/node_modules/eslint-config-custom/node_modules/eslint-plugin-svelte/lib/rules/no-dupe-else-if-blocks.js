"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const ast_utils_1 = require("../utils/ast-utils");
const compat_1 = require("../utils/compat");
function splitByLogicalOperator(operator, node) {
    if (node.type === 'LogicalExpression' && node.operator === operator) {
        return [
            ...splitByLogicalOperator(operator, node.left),
            ...splitByLogicalOperator(operator, node.right)
        ];
    }
    return [node];
}
function splitByOr(node) {
    return splitByLogicalOperator('||', node);
}
function splitByAnd(node) {
    return splitByLogicalOperator('&&', node);
}
function buildOrOperands(node) {
    const orOperands = splitByOr(node);
    return {
        node,
        operands: orOperands.map((orOperand) => {
            const andOperands = splitByAnd(orOperand);
            return {
                node: orOperand,
                operands: andOperands
            };
        })
    };
}
exports.default = (0, utils_1.createRule)('no-dupe-else-if-blocks', {
    meta: {
        docs: {
            description: 'disallow duplicate conditions in `{#if}` / `{:else if}` chains',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [],
        messages: {
            unexpected: 'This branch can never execute. Its condition is a duplicate or covered by previous conditions in the `{#if}` / `{:else if}` chain.'
        },
        type: 'problem'
    },
    create(context) {
        const sourceCode = (0, compat_1.getSourceCode)(context);
        function equal(a, b) {
            if (a.type !== b.type) {
                return false;
            }
            if (a.type === 'LogicalExpression' &&
                b.type === 'LogicalExpression' &&
                (a.operator === '||' || a.operator === '&&') &&
                a.operator === b.operator) {
                return ((equal(a.left, b.left) && equal(a.right, b.right)) ||
                    (equal(a.left, b.right) && equal(a.right, b.left)));
            }
            return (0, ast_utils_1.equalTokens)(a, b, sourceCode);
        }
        function isSubset(operandsA, operandsB) {
            return operandsA.operands.every((operandA) => operandsB.operands.some((operandB) => equal(operandA, operandB)));
        }
        function* iterateIfElseIf(node) {
            let target = node;
            while (target.parent.type === 'SvelteElseBlock' &&
                target.parent.children.includes(target) &&
                target.parent.parent.type === 'SvelteIfBlock') {
                yield target.parent.parent;
                target = target.parent.parent;
            }
        }
        return {
            SvelteIfBlock(node) {
                const test = node.expression;
                const conditionsToCheck = test.type === 'LogicalExpression' && test.operator === '&&'
                    ? [...splitByAnd(test), test]
                    : [test];
                const listToCheck = conditionsToCheck.map(buildOrOperands);
                for (const currentIdBlock of iterateIfElseIf(node)) {
                    if (currentIdBlock.expression) {
                        const currentOrOperands = buildOrOperands(currentIdBlock.expression);
                        for (const condition of listToCheck) {
                            const operands = (condition.operands = condition.operands.filter((orOperand) => {
                                return !currentOrOperands.operands.some((currentOrOperand) => isSubset(currentOrOperand, orOperand));
                            }));
                            if (!operands.length) {
                                context.report({
                                    node: condition.node,
                                    messageId: 'unexpected'
                                });
                                return;
                            }
                        }
                    }
                }
            }
        };
    }
});
