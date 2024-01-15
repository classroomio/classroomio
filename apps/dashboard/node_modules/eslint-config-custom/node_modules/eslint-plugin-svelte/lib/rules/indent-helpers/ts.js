"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineVisitor = void 0;
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const commons_1 = require("./commons");
const commons_2 = require("./commons");
function defineVisitor(context) {
    const { offsets, sourceCode } = context;
    const visitor = {
        TSTypeAnnotation(node) {
            const [colonOrArrowToken, secondToken] = sourceCode.getFirstTokens(node, {
                count: 2,
                includeComments: false
            });
            const baseToken = sourceCode.getFirstToken(node.parent);
            offsets.setOffsetToken([colonOrArrowToken, secondToken], 1, baseToken);
            const before = sourceCode.getTokenBefore(colonOrArrowToken);
            if (before && before.value === '?') {
                offsets.setOffsetToken(before, 1, baseToken);
            }
        },
        TSAsExpression(node) {
            const expressionTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.expression);
            const asOrSatisfiesToken = sourceCode.getTokenAfter(expressionTokens.lastToken);
            offsets.setOffsetToken([asOrSatisfiesToken, (0, commons_2.getFirstAndLastTokens)(sourceCode, node.typeAnnotation).firstToken], 1, expressionTokens.firstToken);
        },
        TSSatisfiesExpression(node) {
            visitor.TSAsExpression(node);
        },
        TSTypeReference(node) {
            const typeArguments = node.typeArguments ?? node.typeParameters;
            if (typeArguments) {
                const firstToken = sourceCode.getFirstToken(node);
                offsets.setOffsetToken(sourceCode.getFirstToken(typeArguments), 1, firstToken);
            }
        },
        TSInstantiationExpression(node) {
            visitor.TSTypeReference(node);
        },
        TSTypeParameterInstantiation(node) {
            offsets.setOffsetElementList(node.params, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), 1);
        },
        TSTypeParameterDeclaration(node) {
            visitor.TSTypeParameterInstantiation(node);
        },
        TSTypeAliasDeclaration(node) {
            const typeToken = sourceCode.getFirstToken(node);
            const idToken = sourceCode.getFirstToken(node.id);
            offsets.setOffsetToken(idToken, 1, typeToken);
            let eqToken;
            if (node.typeParameters) {
                offsets.setOffsetToken(sourceCode.getFirstToken(node.typeParameters), 1, idToken);
                eqToken = sourceCode.getTokenAfter(node.typeParameters);
            }
            else {
                eqToken = sourceCode.getTokenAfter(node.id);
            }
            const initToken = sourceCode.getTokenAfter(eqToken);
            offsets.setOffsetToken([eqToken, initToken], 1, idToken);
        },
        TSFunctionType(node) {
            const firstToken = sourceCode.getFirstToken(node);
            let currToken = firstToken;
            if (node.type === 'TSConstructorType') {
                currToken = sourceCode.getTokenAfter(currToken);
                offsets.setOffsetToken(currToken, 1, firstToken);
            }
            if (node.typeParameters) {
                currToken = sourceCode.getTokenAfter(node.typeParameters);
                offsets.setOffsetToken(currToken, 1, firstToken);
            }
            const leftParenToken = currToken;
            const rightParenToken = sourceCode.getTokenAfter(node.params[node.params.length - 1] || leftParenToken, { filter: eslint_utils_1.isClosingParenToken, includeComments: false });
            offsets.setOffsetElementList(node.params, leftParenToken, rightParenToken, 1);
            const arrowToken = sourceCode.getTokenAfter(rightParenToken);
            offsets.setOffsetToken(arrowToken, 1, leftParenToken);
        },
        TSConstructorType(node) {
            visitor.TSFunctionType(node);
        },
        TSTypeLiteral(node) {
            offsets.setOffsetElementList(node.members, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), 1);
        },
        TSPropertySignature(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const keyTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.key);
            let keyLast;
            if (node.computed) {
                const closeBracket = sourceCode.getTokenAfter(keyTokens.lastToken);
                offsets.setOffsetElementList([node.key], firstToken, closeBracket, 1);
                keyLast = closeBracket;
            }
            else {
                keyLast = keyTokens.lastToken;
            }
            if (node.typeAnnotation) {
                const typeAnnotationToken = sourceCode.getFirstToken(node.typeAnnotation);
                offsets.setOffsetToken([...sourceCode.getTokensBetween(keyLast, typeAnnotationToken), typeAnnotationToken], 1, firstToken);
            }
            else if (node.optional) {
                const qToken = sourceCode.getLastToken(node);
                offsets.setOffsetToken(qToken, 1, firstToken);
            }
        },
        TSIndexSignature(node) {
            const leftBracketToken = sourceCode.getFirstToken(node);
            const rightBracketToken = sourceCode.getTokenAfter(node.parameters[node.parameters.length - 1] || leftBracketToken, { filter: eslint_utils_1.isClosingBracketToken, includeComments: false });
            offsets.setOffsetElementList(node.parameters, leftBracketToken, rightBracketToken, 1);
            const keyLast = rightBracketToken;
            if (node.typeAnnotation) {
                const typeAnnotationToken = sourceCode.getFirstToken(node.typeAnnotation);
                offsets.setOffsetToken([...sourceCode.getTokensBetween(keyLast, typeAnnotationToken), typeAnnotationToken], 1, leftBracketToken);
            }
        },
        TSArrayType(node) {
            const firstToken = sourceCode.getFirstToken(node);
            offsets.setOffsetToken(sourceCode.getLastTokens(node, { count: 2, includeComments: false }), 0, firstToken);
        },
        TSTupleType(node) {
            offsets.setOffsetElementList(node.elementTypes, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), 1);
        },
        TSQualifiedName(node) {
            const objectToken = sourceCode.getFirstToken(node);
            const dotToken = sourceCode.getTokenBefore(node.right);
            const propertyToken = sourceCode.getTokenAfter(dotToken);
            offsets.setOffsetToken([dotToken, propertyToken], 1, objectToken);
        },
        TSIndexedAccessType(node) {
            const objectToken = sourceCode.getFirstToken(node);
            const leftBracketToken = sourceCode.getTokenBefore(node.indexType, {
                filter: eslint_utils_1.isOpeningBracketToken,
                includeComments: false
            });
            const rightBracketToken = sourceCode.getTokenAfter(node.indexType, {
                filter: eslint_utils_1.isClosingBracketToken,
                includeComments: false
            });
            offsets.setOffsetToken(leftBracketToken, 1, objectToken);
            offsets.setOffsetElementList([node.indexType], leftBracketToken, rightBracketToken, 1);
        },
        TSUnionType(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const types = [...node.types];
            if ((0, commons_2.getFirstAndLastTokens)(sourceCode, types[0]).firstToken === firstToken) {
                types.shift();
            }
            offsets.setOffsetElementList(types, firstToken, null, (0, commons_1.isBeginningOfLine)(sourceCode, firstToken) ? 0 : 1);
        },
        TSIntersectionType(node) {
            visitor.TSUnionType(node);
        },
        TSMappedType(node) {
            const leftBraceToken = sourceCode.getFirstToken(node);
            const leftBracketToken = sourceCode.getTokenBefore(node.typeParameter);
            const rightBracketToken = sourceCode.getTokenAfter(node.nameType || node.typeParameter);
            offsets.setOffsetToken([...sourceCode.getTokensBetween(leftBraceToken, leftBracketToken), leftBracketToken], 1, leftBraceToken);
            offsets.setOffsetElementList([node.typeParameter, node.nameType], leftBracketToken, rightBracketToken, 1);
            const rightBraceToken = sourceCode.getLastToken(node);
            if (node.typeAnnotation) {
                const typeAnnotationToken = sourceCode.getFirstToken(node.typeAnnotation);
                offsets.setOffsetToken([
                    ...sourceCode.getTokensBetween(rightBracketToken, typeAnnotationToken),
                    typeAnnotationToken
                ], 1, leftBraceToken);
            }
            else {
                offsets.setOffsetToken([...sourceCode.getTokensBetween(rightBracketToken, rightBraceToken)], 1, leftBraceToken);
            }
            offsets.setOffsetToken(rightBraceToken, 0, leftBraceToken);
        },
        TSTypeParameter(node) {
            const [firstToken, ...afterTokens] = sourceCode.getTokens(node);
            for (const child of [node.constraint, node.default]) {
                if (!child) {
                    continue;
                }
                const [, ...removeTokens] = sourceCode.getTokens(child);
                for (const token of removeTokens) {
                    const i = afterTokens.indexOf(token);
                    if (i >= 0) {
                        afterTokens.splice(i, 1);
                    }
                }
            }
            const secondToken = afterTokens.shift();
            if (!secondToken) {
                return;
            }
            offsets.setOffsetToken(secondToken, 1, firstToken);
            if (secondToken.value === 'extends') {
                let prevToken = null;
                let token = afterTokens.shift();
                while (token) {
                    if (token.value === '=') {
                        break;
                    }
                    offsets.setOffsetToken(token, 1, secondToken);
                    prevToken = token;
                    token = afterTokens.shift();
                }
                while (token) {
                    offsets.setOffsetToken(token, 1, prevToken || secondToken);
                    token = afterTokens.shift();
                }
            }
            else {
                offsets.setOffsetToken(afterTokens, 1, firstToken);
            }
        },
        TSConditionalType(node) {
            const checkTypeToken = sourceCode.getFirstToken(node);
            const extendsToken = sourceCode.getTokenAfter(node.checkType);
            const extendsTypeToken = sourceCode.getFirstToken(node.extendsType);
            offsets.setOffsetToken(extendsToken, 1, checkTypeToken);
            offsets.setOffsetToken(extendsTypeToken, 1, extendsToken);
            const questionToken = sourceCode.getTokenAfter(node.extendsType, {
                filter: eslint_utils_1.isNotClosingParenToken,
                includeComments: false
            });
            const consequentToken = sourceCode.getTokenAfter(questionToken);
            const colonToken = sourceCode.getTokenAfter(node.trueType, {
                filter: eslint_utils_1.isNotClosingParenToken,
                includeComments: false
            });
            const alternateToken = sourceCode.getTokenAfter(colonToken);
            let baseNode = node;
            let parent = baseNode.parent;
            while (parent && parent.type === 'TSConditionalType' && parent.falseType === baseNode) {
                baseNode = parent;
                parent = baseNode.parent;
            }
            const baseToken = sourceCode.getFirstToken(baseNode);
            offsets.setOffsetToken([questionToken, colonToken], 1, baseToken);
            offsets.setOffsetToken(consequentToken, 1, questionToken);
            offsets.setOffsetToken(alternateToken, 1, colonToken);
        },
        TSInterfaceDeclaration(node) {
            const interfaceToken = sourceCode.getFirstToken(node);
            offsets.setOffsetToken(sourceCode.getFirstToken(node.id), 1, interfaceToken);
            if (node.typeParameters != null) {
                offsets.setOffsetToken(sourceCode.getFirstToken(node.typeParameters), 1, sourceCode.getFirstToken(node.id));
            }
            if (node.extends != null && node.extends.length) {
                const extendsToken = sourceCode.getTokenBefore(node.extends[0]);
                offsets.setOffsetToken(extendsToken, 1, interfaceToken);
                offsets.setOffsetElementList(node.extends, extendsToken, null, 1);
            }
            const bodyToken = sourceCode.getFirstToken(node.body);
            offsets.setOffsetToken(bodyToken, 0, interfaceToken);
        },
        TSInterfaceBody(node) {
            offsets.setOffsetElementList(node.body, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), 1);
        },
        TSClassImplements(node) {
            const typeArguments = node.typeArguments ?? node.typeParameters;
            if (typeArguments) {
                offsets.setOffsetToken(sourceCode.getFirstToken(typeArguments), 1, sourceCode.getFirstToken(node));
            }
        },
        TSInterfaceHeritage(node) {
            visitor.TSClassImplements(node);
        },
        TSEnumDeclaration(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const idTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.id);
            const prefixTokens = sourceCode.getTokensBetween(firstToken, idTokens.firstToken);
            offsets.setOffsetToken(prefixTokens, 0, firstToken);
            offsets.setOffsetToken(idTokens.firstToken, 1, firstToken);
            const leftBraceToken = sourceCode.getTokenAfter(idTokens.lastToken);
            const rightBraceToken = sourceCode.getLastToken(node);
            offsets.setOffsetToken(leftBraceToken, 0, firstToken);
            offsets.setOffsetElementList(node.members, leftBraceToken, rightBraceToken, 1);
        },
        TSModuleDeclaration(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const idTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.id);
            const prefixTokens = sourceCode.getTokensBetween(firstToken, idTokens.firstToken);
            offsets.setOffsetToken(prefixTokens, 0, firstToken);
            offsets.setOffsetToken(idTokens.firstToken, 1, firstToken);
            if (node.body) {
                const bodyFirstToken = sourceCode.getFirstToken(node.body);
                offsets.setOffsetToken(bodyFirstToken, (0, eslint_utils_1.isOpeningBraceToken)(bodyFirstToken) ? 0 : 1, firstToken);
            }
        },
        TSModuleBlock(node) {
            visitor.TSInterfaceBody(node);
        },
        TSMethodSignature(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const keyTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.key);
            let keyLast;
            if (node.computed) {
                const closeBracket = sourceCode.getTokenAfter(keyTokens.lastToken);
                offsets.setOffsetElementList([node.key], firstToken, closeBracket, 1);
                keyLast = closeBracket;
            }
            else {
                keyLast = keyTokens.lastToken;
            }
            const leftParenToken = sourceCode.getTokenAfter(keyLast, {
                filter: eslint_utils_1.isOpeningParenToken,
                includeComments: false
            });
            offsets.setOffsetToken([...sourceCode.getTokensBetween(keyLast, leftParenToken), leftParenToken], 1, firstToken);
            const rightParenToken = sourceCode.getTokenAfter(node.params[node.params.length - 1] || leftParenToken, { filter: eslint_utils_1.isClosingParenToken, includeComments: false });
            offsets.setOffsetElementList(node.params, leftParenToken, rightParenToken, 1);
            if (node.returnType) {
                const typeAnnotationToken = sourceCode.getFirstToken(node.returnType);
                offsets.setOffsetToken([...sourceCode.getTokensBetween(keyLast, typeAnnotationToken), typeAnnotationToken], 1, firstToken);
            }
        },
        TSCallSignatureDeclaration(node) {
            const firstToken = sourceCode.getFirstToken(node);
            let currToken = firstToken;
            if (node.type === 'TSConstructSignatureDeclaration') {
                currToken = sourceCode.getTokenAfter(currToken);
                offsets.setOffsetToken(currToken, 1, firstToken);
            }
            if (node.typeParameters) {
                currToken = sourceCode.getTokenAfter(node.typeParameters);
                offsets.setOffsetToken(currToken, 1, firstToken);
            }
            const leftParenToken = currToken;
            const rightParenToken = sourceCode.getTokenAfter(node.params[node.params.length - 1] || leftParenToken, { filter: eslint_utils_1.isClosingParenToken, includeComments: false });
            offsets.setOffsetElementList(node.params, leftParenToken, rightParenToken, 1);
            if (node.returnType) {
                const typeAnnotationToken = sourceCode.getFirstToken(node.returnType);
                offsets.setOffsetToken([
                    ...sourceCode.getTokensBetween(rightParenToken, typeAnnotationToken),
                    typeAnnotationToken
                ], 1, firstToken);
            }
        },
        TSConstructSignatureDeclaration(node) {
            visitor.TSCallSignatureDeclaration(node);
        },
        TSEmptyBodyFunctionExpression(node) {
            const firstToken = sourceCode.getFirstToken(node);
            let leftParenToken, bodyBaseToken;
            if (firstToken.type === 'Punctuator') {
                leftParenToken = firstToken;
                bodyBaseToken = sourceCode.getFirstToken(node.parent);
            }
            else {
                let nextToken = sourceCode.getTokenAfter(firstToken);
                let nextTokenOffset = 0;
                while (nextToken && !(0, eslint_utils_1.isOpeningParenToken)(nextToken) && nextToken.value !== '<') {
                    if (nextToken.value === '*' || (node.id && nextToken.range[0] === node.id.range[0])) {
                        nextTokenOffset = 1;
                    }
                    offsets.setOffsetToken(nextToken, nextTokenOffset, firstToken);
                    nextToken = sourceCode.getTokenAfter(nextToken);
                }
                leftParenToken = nextToken;
                bodyBaseToken = firstToken;
            }
            if (!(0, eslint_utils_1.isOpeningParenToken)(leftParenToken) && node.typeParameters) {
                leftParenToken = sourceCode.getTokenAfter(node.typeParameters);
            }
            const rightParenToken = sourceCode.getTokenAfter(node.params[node.params.length - 1] || leftParenToken, { filter: eslint_utils_1.isClosingParenToken, includeComments: false });
            offsets.setOffsetToken(leftParenToken, 1, bodyBaseToken);
            offsets.setOffsetElementList(node.params, leftParenToken, rightParenToken, 1);
        },
        TSDeclareFunction(node) {
            visitor.TSEmptyBodyFunctionExpression(node);
        },
        TSTypeOperator(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const nextToken = sourceCode.getTokenAfter(firstToken);
            offsets.setOffsetToken(nextToken, 1, firstToken);
        },
        TSTypeQuery(node) {
            visitor.TSTypeOperator(node);
        },
        TSInferType(node) {
            visitor.TSTypeOperator(node);
        },
        TSTypePredicate(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const opToken = sourceCode.getTokenAfter(node.parameterName, {
                filter: eslint_utils_1.isNotClosingParenToken,
                includeComments: false
            });
            const rightToken = node.typeAnnotation && (0, commons_2.getFirstAndLastTokens)(sourceCode, node.typeAnnotation).firstToken;
            offsets.setOffsetToken([opToken, rightToken], 1, (0, commons_2.getFirstAndLastTokens)(sourceCode, firstToken).firstToken);
        },
        TSAbstractMethodDefinition(node) {
            const { keyNode, valueNode } = node.type === 'TSEnumMember'
                ? { keyNode: node.id, valueNode: node.initializer }
                : { keyNode: node.key, valueNode: node.value };
            const firstToken = sourceCode.getFirstToken(node);
            const keyTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, keyNode);
            const prefixTokens = sourceCode.getTokensBetween(firstToken, keyTokens.firstToken);
            if (node.computed) {
                prefixTokens.pop();
            }
            offsets.setOffsetToken(prefixTokens, 0, firstToken);
            let lastKeyToken;
            if (node.computed) {
                const leftBracketToken = sourceCode.getTokenBefore(keyTokens.firstToken);
                const rightBracketToken = (lastKeyToken = sourceCode.getTokenAfter(keyTokens.lastToken));
                offsets.setOffsetToken(leftBracketToken, 0, firstToken);
                offsets.setOffsetElementList([keyNode], leftBracketToken, rightBracketToken, 1);
            }
            else {
                offsets.setOffsetToken(keyTokens.firstToken, 0, firstToken);
                lastKeyToken = keyTokens.lastToken;
            }
            if (valueNode != null) {
                const initToken = sourceCode.getFirstToken(valueNode);
                offsets.setOffsetToken([...sourceCode.getTokensBetween(lastKeyToken, initToken), initToken], 1, lastKeyToken);
            }
        },
        TSAbstractPropertyDefinition(node) {
            visitor.TSAbstractMethodDefinition(node);
        },
        TSEnumMember(node) {
            visitor.TSAbstractMethodDefinition(node);
        },
        TSAbstractAccessorProperty(node) {
            visitor.TSAbstractMethodDefinition(node);
        },
        TSOptionalType(node) {
            offsets.setOffsetToken(sourceCode.getLastToken(node), 1, sourceCode.getFirstToken(node));
        },
        TSNonNullExpression(node) {
            visitor.TSOptionalType(node);
        },
        TSJSDocNonNullableType(node) {
            visitor.TSOptionalType(node);
        },
        TSTypeAssertion(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const expressionToken = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.expression).firstToken;
            offsets.setOffsetElementList([node.typeAnnotation], firstToken, sourceCode.getTokenBefore(expressionToken), 1);
            offsets.setOffsetToken(expressionToken, 1, firstToken);
        },
        TSImportType(node) {
            const typeArguments = node.typeArguments ?? node.typeParameters;
            const firstToken = sourceCode.getFirstToken(node);
            const leftParenToken = sourceCode.getTokenAfter(firstToken, {
                filter: eslint_utils_1.isOpeningParenToken,
                includeComments: false
            });
            offsets.setOffsetToken(leftParenToken, 1, firstToken);
            const argument = node.argument ||
                node.parameter;
            const rightParenToken = sourceCode.getTokenAfter(argument, {
                filter: eslint_utils_1.isClosingParenToken,
                includeComments: false
            });
            offsets.setOffsetElementList([argument], leftParenToken, rightParenToken, 1);
            if (node.qualifier) {
                const dotToken = sourceCode.getTokenBefore(node.qualifier);
                const propertyToken = sourceCode.getTokenAfter(dotToken);
                offsets.setOffsetToken([dotToken, propertyToken], 1, firstToken);
            }
            if (typeArguments) {
                offsets.setOffsetToken(sourceCode.getFirstToken(typeArguments), 1, firstToken);
            }
        },
        TSParameterProperty(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const parameterToken = sourceCode.getFirstToken(node.parameter);
            offsets.setOffsetToken([...sourceCode.getTokensBetween(firstToken, parameterToken), parameterToken], 1, firstToken);
        },
        TSImportEqualsDeclaration(node) {
            const importToken = sourceCode.getFirstToken(node);
            const idTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.id);
            offsets.setOffsetToken(idTokens.firstToken, 1, importToken);
            const opToken = sourceCode.getTokenAfter(idTokens.lastToken);
            offsets.setOffsetToken([opToken, sourceCode.getFirstToken(node.moduleReference)], 1, idTokens.lastToken);
        },
        TSExternalModuleReference(node) {
            const requireToken = sourceCode.getFirstToken(node);
            const leftParenToken = sourceCode.getTokenAfter(requireToken, {
                filter: eslint_utils_1.isOpeningParenToken,
                includeComments: false
            });
            const rightParenToken = sourceCode.getLastToken(node);
            offsets.setOffsetToken(leftParenToken, 1, requireToken);
            offsets.setOffsetElementList([node.expression], leftParenToken, rightParenToken, 1);
        },
        TSExportAssignment(node) {
            const exportNode = sourceCode.getFirstToken(node);
            const exprTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.expression);
            const opToken = sourceCode.getTokenBefore(exprTokens.firstToken);
            offsets.setOffsetToken([opToken, exprTokens.firstToken], 1, exportNode);
        },
        TSNamedTupleMember(node) {
            const labelToken = sourceCode.getFirstToken(node);
            const elementTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.elementType);
            offsets.setOffsetToken([
                ...sourceCode.getTokensBetween(labelToken, elementTokens.firstToken),
                elementTokens.firstToken
            ], 1, labelToken);
        },
        TSRestType(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const nextToken = sourceCode.getTokenAfter(firstToken);
            offsets.setOffsetToken(nextToken, 1, firstToken);
        },
        TSNamespaceExportDeclaration(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const idToken = sourceCode.getFirstToken(node.id);
            offsets.setOffsetToken([...sourceCode.getTokensBetween(firstToken, idToken), idToken], 1, firstToken);
        },
        TSTemplateLiteralType(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const quasiTokens = node.quasis.slice(1).map((n) => sourceCode.getFirstToken(n));
            const expressionToken = node.quasis.slice(0, -1).map((n) => sourceCode.getTokenAfter(n));
            offsets.setOffsetToken(quasiTokens, 0, firstToken);
            offsets.setOffsetToken(expressionToken, 1, firstToken);
        },
        Decorator(node) {
            const [atToken, secondToken] = sourceCode.getFirstTokens(node, {
                count: 2,
                includeComments: false
            });
            offsets.setOffsetToken(secondToken, 0, atToken);
            const parent = node.parent;
            const { decorators } = parent;
            if (!decorators || decorators.length === 0) {
                return;
            }
            if (decorators[0] === node) {
                if (parent.range[0] === node.range[0]) {
                    const startParentToken = sourceCode.getTokenAfter(decorators[decorators?.length - 1]);
                    offsets.setOffsetToken(startParentToken, 0, atToken);
                }
                else {
                    const startParentToken = sourceCode.getFirstToken(parent.parent &&
                        (parent.parent.type === 'ExportDefaultDeclaration' ||
                            parent.parent.type === 'ExportNamedDeclaration') &&
                        node.range[0] < parent.parent.range[0]
                        ? parent.parent
                        : parent);
                    offsets.copyOffset(atToken.range[0], startParentToken.range[0]);
                }
            }
            else {
                offsets.setOffsetToken(atToken, 0, sourceCode.getFirstToken(decorators[0]));
            }
        },
        AccessorProperty(node) {
            const keyNode = node.key;
            const valueNode = node.value;
            const firstToken = sourceCode.getFirstToken(node);
            const keyTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, keyNode);
            const prefixTokens = sourceCode.getTokensBetween(firstToken, keyTokens.firstToken);
            if (node.computed) {
                prefixTokens.pop();
            }
            offsets.setOffsetToken(prefixTokens, 0, firstToken);
            let lastKeyToken;
            if (node.computed) {
                const leftBracketToken = sourceCode.getTokenBefore(keyTokens.firstToken);
                const rightBracketToken = (lastKeyToken = sourceCode.getTokenAfter(keyTokens.lastToken));
                offsets.setOffsetToken(leftBracketToken, 0, firstToken);
                offsets.setOffsetElementList([keyNode], leftBracketToken, rightBracketToken, 1);
            }
            else {
                offsets.setOffsetToken(keyTokens.firstToken, 0, firstToken);
                lastKeyToken = keyTokens.lastToken;
            }
            if (valueNode != null) {
                const initToken = sourceCode.getFirstToken(valueNode);
                offsets.setOffsetToken([...sourceCode.getTokensBetween(lastKeyToken, initToken), initToken], 1, lastKeyToken);
            }
        },
        StaticBlock(node) {
            const firstToken = sourceCode.getFirstToken(node);
            let next = sourceCode.getTokenAfter(firstToken);
            while (next && (0, eslint_utils_1.isNotOpeningBraceToken)(next)) {
                offsets.setOffsetToken(next, 0, firstToken);
                next = sourceCode.getTokenAfter(next);
            }
            offsets.setOffsetToken(next, 0, firstToken);
            offsets.setOffsetElementList(node.body, next, sourceCode.getLastToken(node), 1);
        },
        ImportAttribute(node) {
            const firstToken = sourceCode.getFirstToken(node);
            const keyTokens = (0, commons_2.getFirstAndLastTokens)(sourceCode, node.key);
            const prefixTokens = sourceCode.getTokensBetween(firstToken, keyTokens.firstToken);
            offsets.setOffsetToken(prefixTokens, 0, firstToken);
            offsets.setOffsetToken(keyTokens.firstToken, 0, firstToken);
            const initToken = sourceCode.getFirstToken(node.value);
            offsets.setOffsetToken([...sourceCode.getTokensBetween(keyTokens.lastToken, initToken), initToken], 1, keyTokens.lastToken);
        },
        TSAnyKeyword() {
        },
        TSBigIntKeyword() {
        },
        TSBooleanKeyword() {
        },
        TSNeverKeyword() {
        },
        TSNullKeyword() {
        },
        TSNumberKeyword() {
        },
        TSObjectKeyword() {
        },
        TSStringKeyword() {
        },
        TSSymbolKeyword() {
        },
        TSUndefinedKeyword() {
        },
        TSUnknownKeyword() {
        },
        TSVoidKeyword() {
        },
        TSAbstractKeyword() {
        },
        TSAsyncKeyword() {
        },
        TSPrivateKeyword() {
        },
        TSProtectedKeyword() {
        },
        TSPublicKeyword() {
        },
        TSReadonlyKeyword() {
        },
        TSStaticKeyword() {
        },
        TSDeclareKeyword() {
        },
        TSExportKeyword() {
        },
        TSIntrinsicKeyword() {
        },
        TSThisType() {
        },
        TSLiteralType() {
        }
    };
    const commonsVisitor = {
        ['TSTypeAliasDeclaration, TSCallSignatureDeclaration, TSConstructSignatureDeclaration, TSImportEqualsDeclaration,' +
            'TSAbstractMethodDefinition, TSAbstractPropertyDefinition, AccessorProperty,  TSAbstractAccessorProperty, TSEnumMember,' +
            'TSPropertySignature, TSIndexSignature, TSMethodSignature,' +
            'TSAbstractClassProperty, ClassProperty'](node) {
            const firstToken = sourceCode.getFirstToken(node);
            const lastToken = sourceCode.getLastToken(node);
            if ((0, eslint_utils_1.isSemicolonToken)(lastToken) && firstToken !== lastToken) {
                const next = sourceCode.getTokenAfter(lastToken);
                if (!next || lastToken.loc.start.line < next.loc.start.line) {
                    offsets.setOffsetToken(lastToken, 0, firstToken);
                }
            }
        },
        '*[type=/^TS/]'(node) {
            if (node.type !== 'TSAnyKeyword' &&
                node.type !== 'TSArrayType' &&
                node.type !== 'TSBigIntKeyword' &&
                node.type !== 'TSBooleanKeyword' &&
                node.type !== 'TSConditionalType' &&
                node.type !== 'TSConstructorType' &&
                node.type !== 'TSFunctionType' &&
                node.type !== 'TSImportType' &&
                node.type !== 'TSIndexedAccessType' &&
                node.type !== 'TSInferType' &&
                node.type !== 'TSIntersectionType' &&
                node.type !== 'TSIntrinsicKeyword' &&
                node.type !== 'TSLiteralType' &&
                node.type !== 'TSMappedType' &&
                node.type !== 'TSNamedTupleMember' &&
                node.type !== 'TSNeverKeyword' &&
                node.type !== 'TSNullKeyword' &&
                node.type !== 'TSNumberKeyword' &&
                node.type !== 'TSObjectKeyword' &&
                node.type !== 'TSOptionalType' &&
                node.type !== 'TSRestType' &&
                node.type !== 'TSStringKeyword' &&
                node.type !== 'TSSymbolKeyword' &&
                node.type !== 'TSTemplateLiteralType' &&
                node.type !== 'TSThisType' &&
                node.type !== 'TSTupleType' &&
                node.type !== 'TSTypeLiteral' &&
                node.type !== 'TSTypeOperator' &&
                node.type !== 'TSTypePredicate' &&
                node.type !== 'TSTypeQuery' &&
                node.type !== 'TSTypeReference' &&
                node.type !== 'TSUndefinedKeyword' &&
                node.type !== 'TSUnionType' &&
                node.type !== 'TSUnknownKeyword' &&
                node.type !== 'TSVoidKeyword') {
                return;
            }
            const typeNode = node;
            if (typeNode.parent.type === 'TSParenthesizedType') {
                return;
            }
            let leftToken = sourceCode.getTokenBefore(typeNode);
            let rightToken = sourceCode.getTokenAfter(typeNode);
            let firstToken = sourceCode.getFirstToken(typeNode);
            while (leftToken &&
                (0, eslint_utils_1.isOpeningParenToken)(leftToken) &&
                rightToken &&
                (0, eslint_utils_1.isClosingParenToken)(rightToken)) {
                offsets.setOffsetToken(firstToken, 1, leftToken);
                offsets.setOffsetToken(rightToken, 0, leftToken);
                firstToken = leftToken;
                leftToken = sourceCode.getTokenBefore(leftToken);
                rightToken = sourceCode.getTokenAfter(rightToken);
            }
        }
    };
    const extendsESVisitor = {
        ['ClassDeclaration[implements], ClassDeclaration[typeParameters], ClassDeclaration[superTypeParameters],' +
            'ClassExpression[implements], ClassExpression[typeParameters], ClassExpression[superTypeParameters]'](node) {
            if (node.typeParameters != null) {
                offsets.setOffsetToken(sourceCode.getFirstToken(node.typeParameters), 1, sourceCode.getFirstToken(node.id || node));
            }
            const superTypeArguments = node.superTypeArguments ?? node.superTypeParameters;
            if (superTypeArguments != null && node.superClass != null) {
                offsets.setOffsetToken(sourceCode.getFirstToken(superTypeArguments), 1, sourceCode.getFirstToken(node.superClass));
            }
            if (node.implements != null && node.implements.length) {
                const classToken = sourceCode.getFirstToken(node);
                const implementsToken = sourceCode.getTokenBefore(node.implements[0]);
                offsets.setOffsetToken(implementsToken, 1, classToken);
                offsets.setOffsetElementList(node.implements, implementsToken, null, 1);
            }
        }
    };
    const deprecatedVisitor = {
        TSParenthesizedType(node) {
            offsets.setOffsetElementList([node.typeAnnotation], sourceCode.getFirstToken(node), sourceCode.getLastToken(node), 1);
        },
        ClassProperty(node) {
            visitor.TSAbstractMethodDefinition(node);
        },
        TSAbstractClassProperty(node) {
            visitor.TSAbstractMethodDefinition(node);
        }
    };
    const v = visitor;
    return {
        ...v,
        ...commonsVisitor,
        ...extendsESVisitor,
        ...deprecatedVisitor
    };
}
exports.defineVisitor = defineVisitor;
