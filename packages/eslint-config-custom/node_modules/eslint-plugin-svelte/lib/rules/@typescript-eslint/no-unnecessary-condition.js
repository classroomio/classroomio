"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const ts_utils_1 = require("../../utils/ts-utils");
const compat_1 = require("../../utils/compat");
function unionTypeParts(type) {
    return [...iterate(type)];
    function* iterate(t) {
        if (t.isUnion()) {
            for (const type of t.types) {
                yield* iterate(type);
            }
        }
        else {
            yield t;
        }
    }
}
function isPossiblyFalsy(type, tsTools) {
    return (unionTypeParts(type)
        .filter((t) => !(0, ts_utils_1.isTruthyLiteral)(t, tsTools))
        .some((type) => (0, ts_utils_1.isPossiblyFalsyType)(type, tsTools.ts)));
}
function isPossiblyTruthy(type, tsTools) {
    return unionTypeParts(type).some((type) => !(0, ts_utils_1.isFalsyType)(type, tsTools));
}
function isPossiblyNullish(type, tsTools) {
    return (0, ts_utils_1.isNullableType)(type, tsTools.ts);
}
function isAlwaysNullish(type, tsTools) {
    return (0, ts_utils_1.isNullishType)(type, tsTools.ts);
}
function isLiteral(type, tsTools) {
    return ((0, ts_utils_1.isBooleanLiteralType)(type, tsTools.ts) || (0, ts_utils_1.isNullishType)(type, tsTools.ts) || type.isLiteral());
}
exports.default = (0, utils_1.createRule)('@typescript-eslint/no-unnecessary-condition', {
    meta: {
        docs: {
            description: 'disallow conditionals where the type is always truthy or always falsy',
            category: 'Extension Rules',
            recommended: false,
            extensionRule: {
                plugin: '@typescript-eslint/eslint-plugin',
                url: 'https://typescript-eslint.io/rules/no-unnecessary-condition/'
            }
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowConstantLoopConditions: {
                        description: 'Whether to ignore constant loop conditions, such as `while (true)`.',
                        type: 'boolean'
                    },
                    allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: {
                        description: 'Whether to not error when running with a tsconfig that has strictNullChecks turned.',
                        type: 'boolean'
                    }
                },
                additionalProperties: false
            }
        ],
        fixable: 'code',
        messages: {
            alwaysTruthy: 'Unnecessary conditional, value is always truthy.',
            alwaysFalsy: 'Unnecessary conditional, value is always falsy.',
            alwaysTruthyFunc: 'This callback should return a conditional, but return is always truthy.',
            alwaysFalsyFunc: 'This callback should return a conditional, but return is always falsy.',
            neverNullish: 'Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.',
            alwaysNullish: 'Unnecessary conditional, left-hand side of `??` operator is always `null` or `undefined`.',
            literalBooleanExpression: 'Unnecessary conditional, both sides of the expression are literal values.',
            noOverlapBooleanExpression: 'Unnecessary conditional, the types have no overlap.',
            never: 'Unnecessary conditional, value is `never`.',
            neverOptionalChain: 'Unnecessary optional chain on a non-nullish value.',
            noStrictNullCheck: 'This rule requires the `strictNullChecks` compiler option to be turned on to function correctly.'
        },
        type: 'suggestion',
        deprecated: true,
        replacedBy: {
            note: 'This rule is no longer needed when using svelte-eslint-parser>=v0.19.0.'
        }
    },
    create(context) {
        const { allowConstantLoopConditions = false, allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing = false } = (context.options[0] || {});
        const tools = (0, ts_utils_1.getTypeScriptTools)(context);
        if (!tools) {
            return {};
        }
        const { service, ts } = tools;
        const checker = service.program.getTypeChecker();
        const sourceCode = (0, compat_1.getSourceCode)(context);
        const compilerOptions = service.program.getCompilerOptions();
        const isStrictNullChecks = compilerOptions.strict
            ? compilerOptions.strictNullChecks !== false
            : compilerOptions.strictNullChecks;
        if (!isStrictNullChecks && allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing !== true) {
            context.report({
                loc: {
                    start: { line: 0, column: 0 },
                    end: { line: 0, column: 0 }
                },
                messageId: 'noStrictNullCheck'
            });
        }
        const mutableVarReferenceIds = [];
        const scriptElements = [];
        let inSvelteReactiveStatement = false;
        for (const scope of [
            sourceCode.scopeManager.globalScope,
            sourceCode.scopeManager.globalScope?.childScopes.find((scope) => scope.type === 'module')
        ]) {
            if (!scope)
                continue;
            for (const variable of scope.variables) {
                if (variable.defs.some((def) => def.type === 'Variable' && (def.parent.kind === 'var' || def.parent.kind === 'let'))) {
                    for (const reference of variable.references) {
                        mutableVarReferenceIds.push(reference.identifier);
                    }
                }
            }
        }
        for (const body of sourceCode.ast.body) {
            if (body.type === 'SvelteScriptElement') {
                scriptElements.push(body);
            }
        }
        function hasSvelteReactiveVar(node) {
            const inReactiveScope = inSvelteReactiveStatement ||
                (scriptElements.length &&
                    scriptElements.every((elem) => node.range[1] <= elem.range[0] || elem.range[1] <= node.range[0]));
            if (!inReactiveScope) {
                return false;
            }
            return mutableVarReferenceIds.some((id) => node.range[0] <= id.range[0] && id.range[1] <= node.range[1]);
        }
        function getNodeType(node) {
            const tsNode = service.esTreeNodeToTSNodeMap.get(node);
            return tsNode && (0, ts_utils_1.getConstrainedTypeAtLocation)(checker, tsNode);
        }
        function nodeIsArrayType(node) {
            const nodeType = getNodeType(node);
            if (!nodeType) {
                return false;
            }
            return checker.isArrayType(nodeType);
        }
        function nodeIsTupleType(node) {
            const nodeType = getNodeType(node);
            return Boolean(nodeType && (0, ts_utils_1.isTupleType)(nodeType, ts));
        }
        function isArrayIndexExpression(node) {
            return (node.type === 'MemberExpression' &&
                node.computed &&
                (nodeIsArrayType(node.object) ||
                    (nodeIsTupleType(node.object) &&
                        node.property.type !== 'Literal')));
        }
        function checkNode(node, isUnaryNotArgument = false) {
            if (hasSvelteReactiveVar(node)) {
                return;
            }
            if (node.type === 'UnaryExpression' && node.operator === '!') {
                checkNode(node.argument, true);
                return;
            }
            if (isArrayIndexExpression(node)) {
                return;
            }
            if (node.type === 'LogicalExpression' && node.operator !== '??') {
                checkNode(node.right);
                return;
            }
            const type = getNodeType(node);
            if (!type ||
                unionTypeParts(type).some((part) => (0, ts_utils_1.isAnyType)(part, ts) || (0, ts_utils_1.isUnknownType)(part, ts) || part.isTypeParameter())) {
                return;
            }
            let messageId = null;
            if (unionTypeParts(type).some((part) => (0, ts_utils_1.isNeverType)(part, ts))) {
                messageId = 'never';
            }
            else if (!isPossiblyTruthy(type, tools)) {
                messageId = !isUnaryNotArgument ? 'alwaysFalsy' : 'alwaysTruthy';
            }
            else if (!isPossiblyFalsy(type, tools)) {
                messageId = !isUnaryNotArgument ? 'alwaysTruthy' : 'alwaysFalsy';
            }
            if (messageId) {
                context.report({ node, messageId });
            }
        }
        function checkNodeForNullish(node) {
            if (hasSvelteReactiveVar(node)) {
                return;
            }
            const type = getNodeType(node);
            if (!type || (0, ts_utils_1.isAnyType)(type, ts) || (0, ts_utils_1.isUnknownType)(type, ts)) {
                return;
            }
            let messageId = null;
            if (unionTypeParts(type).some((part) => (0, ts_utils_1.isNeverType)(part, ts))) {
                messageId = 'never';
            }
            else if (!isPossiblyNullish(type, tools)) {
                if (!isArrayIndexExpression(node) &&
                    !(node.type === 'ChainExpression' &&
                        node.expression.type !== 'TSNonNullExpression' &&
                        optionChainContainsOptionArrayIndex(node.expression))) {
                    messageId = 'neverNullish';
                }
            }
            else if (isAlwaysNullish(type, tools)) {
                messageId = 'alwaysNullish';
            }
            if (messageId) {
                context.report({ node, messageId });
            }
        }
        const BOOL_OPERATORS = new Set(['<', '>', '<=', '>=', '==', '===', '!=', '!==']);
        function checkIfBinaryExpressionIsNecessaryConditional(node) {
            if (hasSvelteReactiveVar(node)) {
                return;
            }
            if (!BOOL_OPERATORS.has(node.operator)) {
                return;
            }
            const leftType = getNodeType(node.left);
            const rightType = getNodeType(node.right);
            if (!leftType || !rightType) {
                return;
            }
            if (isLiteral(leftType, tools) && isLiteral(rightType, tools)) {
                context.report({ node, messageId: 'literalBooleanExpression' });
                return;
            }
            if (isStrictNullChecks) {
                const UNDEFINED = ts.TypeFlags.Undefined;
                const NULL = ts.TypeFlags.Null;
                const isComparable = (type, f) => {
                    let flag = f;
                    flag |= ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter;
                    if (node.operator === '==' || node.operator === '!=') {
                        flag |= NULL | UNDEFINED;
                    }
                    return unionTypeParts(type).some((t) => (t.flags & flag) !== 0);
                };
                if ((leftType.flags === UNDEFINED && !isComparable(rightType, UNDEFINED)) ||
                    (rightType.flags === UNDEFINED && !isComparable(leftType, UNDEFINED)) ||
                    (leftType.flags === NULL && !isComparable(rightType, NULL)) ||
                    (rightType.flags === NULL && !isComparable(leftType, NULL))) {
                    context.report({ node, messageId: 'noOverlapBooleanExpression' });
                }
            }
        }
        function checkLogicalExpressionForUnnecessaryConditionals(node) {
            if (node.operator === '??') {
                checkNodeForNullish(node.left);
                return;
            }
            checkNode(node.left);
        }
        function checkIfLoopIsNecessaryConditional(node) {
            if (node.test === null) {
                return;
            }
            if (allowConstantLoopConditions) {
                const nodeType = getNodeType(node.test);
                if (nodeType &&
                    (0, ts_utils_1.isBooleanLiteralType)(nodeType, ts) &&
                    checker.typeToString(nodeType) === 'true')
                    return;
            }
            checkNode(node.test);
        }
        const ARRAY_PREDICATE_FUNCTIONS = new Set(['filter', 'find', 'some', 'every']);
        function isArrayPredicateFunction(node) {
            const { callee } = node;
            return (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier' &&
                ARRAY_PREDICATE_FUNCTIONS.has(callee.property.name) &&
                (nodeIsArrayType(callee.object) || nodeIsTupleType(callee.object)));
        }
        function checkCallExpression(node) {
            if (isArrayPredicateFunction(node) && node.arguments.length) {
                const callback = node.arguments[0];
                if ((callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') &&
                    callback.body) {
                    if (callback.body.type !== 'BlockStatement') {
                        checkNode(callback.body);
                        return;
                    }
                    const callbackBody = callback.body.body;
                    if (callbackBody.length === 1 &&
                        callbackBody[0].type === 'ReturnStatement' &&
                        callbackBody[0].argument) {
                        checkNode(callbackBody[0].argument);
                        return;
                    }
                }
                const nodeType = getNodeType(callback);
                if (!nodeType) {
                    return;
                }
                const returnTypes = (0, ts_utils_1.getCallSignaturesOfType)(nodeType).map((sig) => sig.getReturnType());
                if (returnTypes.length === 0) {
                    return;
                }
                if (returnTypes.some((t) => (0, ts_utils_1.isAnyType)(t, ts) || (0, ts_utils_1.isUnknownType)(t, ts))) {
                    return;
                }
                if (!returnTypes.some((t) => isPossiblyFalsy(t, tools))) {
                    context.report({
                        node: callback,
                        messageId: 'alwaysTruthyFunc'
                    });
                    return;
                }
                if (!returnTypes.some((t) => isPossiblyTruthy(t, tools))) {
                    context.report({
                        node: callback,
                        messageId: 'alwaysFalsyFunc'
                    });
                }
            }
        }
        function optionChainContainsOptionArrayIndex(node) {
            const lhsNode = node.type === 'CallExpression' ? node.callee : node.object;
            if (node.optional && isArrayIndexExpression(lhsNode)) {
                return true;
            }
            if (lhsNode.type === 'MemberExpression' || lhsNode.type === 'CallExpression') {
                return optionChainContainsOptionArrayIndex(lhsNode);
            }
            return false;
        }
        function isNullablePropertyType(objType, propertyType) {
            if (propertyType.isUnion()) {
                return propertyType.types.some((type) => isNullablePropertyType(objType, type));
            }
            if (propertyType.isNumberLiteral() || propertyType.isStringLiteral()) {
                const propType = (0, ts_utils_1.getTypeOfPropertyOfType)(objType, propertyType.value.toString(), checker);
                if (propType) {
                    return (0, ts_utils_1.isNullableType)(propType, ts);
                }
            }
            const typeName = (0, ts_utils_1.getTypeName)(propertyType, tools);
            return Boolean((typeName === 'string' && checker.getIndexInfoOfType(objType, ts.IndexKind.String)) ||
                (typeName === 'number' && checker.getIndexInfoOfType(objType, ts.IndexKind.Number)));
        }
        function isNullableOriginFromPrev(node) {
            const prevType = getNodeType(node.object);
            const property = node.property;
            if (prevType && prevType.isUnion() && property.type === 'Identifier') {
                const isOwnNullable = prevType.types.some((type) => {
                    if (node.computed) {
                        const propertyType = getNodeType(node.property);
                        return Boolean(propertyType && isNullablePropertyType(type, propertyType));
                    }
                    const propType = (0, ts_utils_1.getTypeOfPropertyOfType)(type, property.name, checker);
                    return propType && (0, ts_utils_1.isNullableType)(propType, ts);
                });
                return !isOwnNullable && (0, ts_utils_1.isNullableType)(prevType, ts);
            }
            return false;
        }
        function isOptionableExpression(node) {
            const type = getNodeType(node);
            if (!type) {
                return false;
            }
            const isOwnNullable = node.type === 'MemberExpression' ? !isNullableOriginFromPrev(node) : true;
            return ((0, ts_utils_1.isAnyType)(type, ts) ||
                (0, ts_utils_1.isUnknownType)(type, ts) ||
                ((0, ts_utils_1.isNullableType)(type, ts) && isOwnNullable));
        }
        function checkOptionalChain(node, beforeOperator, fix) {
            if (!node.optional) {
                return;
            }
            if (optionChainContainsOptionArrayIndex(node)) {
                return;
            }
            const nodeToCheck = node.type === 'CallExpression' ? node.callee : node.object;
            if (hasSvelteReactiveVar(nodeToCheck)) {
                return;
            }
            if (isOptionableExpression(nodeToCheck)) {
                return;
            }
            const questionDotOperator = sourceCode.getTokenAfter(beforeOperator, {
                includeComments: false,
                filter: (token) => token.type === 'Punctuator' && token.value === '?.'
            });
            context.report({
                node,
                loc: questionDotOperator.loc,
                messageId: 'neverOptionalChain',
                fix(fixer) {
                    return fixer.replaceText(questionDotOperator, fix);
                }
            });
        }
        function checkOptionalMemberExpression(node) {
            checkOptionalChain(node, node.object, node.computed ? '' : '.');
        }
        function checkOptionalCallExpression(node) {
            checkOptionalChain(node, node.callee, '');
        }
        return {
            SvelteReactiveStatement: () => (inSvelteReactiveStatement = true),
            'SvelteReactiveStatement:exit': () => (inSvelteReactiveStatement = false),
            BinaryExpression: checkIfBinaryExpressionIsNecessaryConditional,
            CallExpression: checkCallExpression,
            ConditionalExpression: (node) => checkNode(node.test),
            DoWhileStatement: checkIfLoopIsNecessaryConditional,
            ForStatement: checkIfLoopIsNecessaryConditional,
            IfStatement: (node) => checkNode(node.test),
            LogicalExpression: checkLogicalExpressionForUnnecessaryConditionals,
            WhileStatement: checkIfLoopIsNecessaryConditional,
            'MemberExpression[optional = true]': checkOptionalMemberExpression,
            'CallExpression[optional = true]': checkOptionalCallExpression
        };
    }
});
