"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStoreChecker = exports.extractStoreReferences = void 0;
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const ts_utils_1 = require("../../utils/ts-utils");
const ast_utils_1 = require("../../utils/ast-utils");
const compat_1 = require("../../utils/compat");
function* extractStoreReferences(context, storeNames = ['writable', 'readable', 'derived']) {
    const referenceTracker = new eslint_utils_1.ReferenceTracker((0, compat_1.getSourceCode)(context).scopeManager.globalScope);
    for (const { node, path } of referenceTracker.iterateEsmReferences({
        'svelte/store': {
            [eslint_utils_1.ReferenceTracker.ESM]: true,
            writable: {
                [eslint_utils_1.ReferenceTracker.CALL]: storeNames.includes('writable')
            },
            readable: {
                [eslint_utils_1.ReferenceTracker.CALL]: storeNames.includes('readable')
            },
            derived: {
                [eslint_utils_1.ReferenceTracker.CALL]: storeNames.includes('derived')
            }
        }
    })) {
        yield {
            node: node,
            name: path[path.length - 1]
        };
    }
}
exports.extractStoreReferences = extractStoreReferences;
function createStoreChecker(context) {
    const tools = (0, ts_utils_1.getTypeScriptTools)(context);
    const checker = tools ? createStoreCheckerForTS(tools) : createStoreCheckerForES(context);
    return (node, options) => checker(node, {
        consistent: options?.consistent ?? false
    });
}
exports.createStoreChecker = createStoreChecker;
function createStoreCheckerForES(context) {
    const storeVariables = new Map();
    for (const { node } of extractStoreReferences(context)) {
        const parent = (0, ast_utils_1.getParent)(node);
        if (!parent || parent.type !== 'VariableDeclarator' || parent.id.type !== 'Identifier') {
            continue;
        }
        const decl = (0, ast_utils_1.getParent)(parent);
        if (!decl || decl.type !== 'VariableDeclaration') {
            continue;
        }
        const variable = (0, ast_utils_1.findVariable)(context, parent.id);
        if (variable) {
            storeVariables.set(variable, { const: decl.kind === 'const' });
        }
    }
    return (node, options) => {
        if (node.type !== 'Identifier' || node.name.startsWith('$')) {
            return false;
        }
        const variable = (0, ast_utils_1.findVariable)(context, node);
        if (!variable) {
            return false;
        }
        const info = storeVariables.get(variable);
        if (!info) {
            return false;
        }
        return options.consistent ? info.const : true;
    };
}
function createStoreCheckerForTS(tools) {
    const { service } = tools;
    const checker = service.program.getTypeChecker();
    const tsNodeMap = service.esTreeNodeToTSNodeMap;
    return (node, options) => {
        const tsNode = tsNodeMap.get(node);
        if (!tsNode) {
            return false;
        }
        const type = checker.getTypeAtLocation(tsNode);
        return isStoreType(checker.getApparentType(type));
        function isStoreType(type) {
            return eachTypeCheck(type, options, (type) => {
                const subscribe = type.getProperty('subscribe');
                if (!subscribe) {
                    return false;
                }
                const subscribeType = checker.getTypeOfSymbolAtLocation(subscribe, tsNode);
                return isStoreSubscribeSignatureType(subscribeType);
            });
        }
        function isStoreSubscribeSignatureType(type) {
            return eachTypeCheck(type, options, (type) => {
                for (const signature of type.getCallSignatures()) {
                    if (signature.parameters.length >= 2 &&
                        maybeFunctionSymbol(signature.parameters[0]) &&
                        maybeFunctionSymbol(signature.parameters[1])) {
                        return true;
                    }
                }
                return false;
            });
        }
        function maybeFunctionSymbol(param) {
            const type = checker.getApparentType(checker.getTypeOfSymbolAtLocation(param, tsNode));
            return maybeFunctionType(type);
        }
        function maybeFunctionType(type) {
            return eachTypeCheck(type, { consistent: false }, (type) => {
                return type.getCallSignatures().length > 0;
            });
        }
    };
}
function eachTypeCheck(type, options, check) {
    if (type.isUnion()) {
        if (options.consistent) {
            return type.types.every((t) => eachTypeCheck(t, options, check));
        }
        return type.types.some((t) => eachTypeCheck(t, options, check));
    }
    return check(type);
}
