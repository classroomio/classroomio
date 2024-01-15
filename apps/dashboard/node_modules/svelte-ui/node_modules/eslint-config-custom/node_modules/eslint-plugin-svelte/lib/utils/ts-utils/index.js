"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOfPropertyOfType = exports.getTypeName = exports.getConstrainedTypeAtLocation = exports.getCallSignaturesOfType = exports.isPossiblyFalsyType = exports.isNullType = exports.isVoidType = exports.isUndefinedType = exports.isNeverType = exports.isUnknownType = exports.isAnyType = exports.isTupleType = exports.isTupleObjectType = exports.isReferenceObjectType = exports.isObjectType = exports.isBooleanLiteralType = exports.isNullableType = exports.isNullishType = exports.isFalsyType = exports.isTruthyLiteral = exports.getTypeScript = exports.getTypeScriptTools = void 0;
const load_module_1 = require("../load-module");
const compat_1 = require("../compat");
function getTypeScriptTools(context) {
    const ts = getTypeScript(context);
    if (!ts) {
        return null;
    }
    const sourceCode = (0, compat_1.getSourceCode)(context);
    const { program, esTreeNodeToTSNodeMap, tsNodeToESTreeNodeMap } = sourceCode.parserServices;
    if (!program || !esTreeNodeToTSNodeMap || !tsNodeToESTreeNodeMap) {
        return null;
    }
    const hasFullTypeInformation = sourceCode.parserServices.hasFullTypeInformation ?? true;
    if (!hasFullTypeInformation) {
        return null;
    }
    return {
        service: {
            esTreeNodeToTSNodeMap,
            tsNodeToESTreeNodeMap,
            hasFullTypeInformation,
            program
        },
        ts
    };
}
exports.getTypeScriptTools = getTypeScriptTools;
let cacheTypeScript = null;
function getTypeScript(context) {
    if (cacheTypeScript) {
        return cacheTypeScript;
    }
    cacheTypeScript = (0, load_module_1.loadModule)(context, 'typescript');
    if (cacheTypeScript) {
        return cacheTypeScript;
    }
    try {
        cacheTypeScript ?? (cacheTypeScript = require('typescript'));
    }
    catch {
    }
    return cacheTypeScript;
}
exports.getTypeScript = getTypeScript;
function isTruthyLiteral(type, tsTools) {
    if (type.isUnion()) {
        return type.types.every((t) => isTruthyLiteral(t, tsTools));
    }
    return ((isBooleanLiteralType(type, tsTools.ts) &&
        tsTools.service.program.getTypeChecker().typeToString(type) === 'true') ||
        (type.isLiteral() && Boolean(type.value)));
}
exports.isTruthyLiteral = isTruthyLiteral;
function isFalsyType(type, tsTools) {
    if (type.isUnion()) {
        return type.types.every((t) => isFalsyType(t, tsTools));
    }
    if (isUndefinedType(type, tsTools.ts) ||
        isNullType(type, tsTools.ts) ||
        isVoidType(type, tsTools.ts))
        return true;
    if (type.isLiteral())
        return !type.value;
    return (isBooleanLiteralType(type, tsTools.ts) &&
        tsTools.service.program.getTypeChecker().typeToString(type) === 'false');
}
exports.isFalsyType = isFalsyType;
function isNullishType(type, ts) {
    if (type.isUnion()) {
        return type.types.every((t) => isNullishType(t, ts));
    }
    return isNullType(type, ts) || isUndefinedType(type, ts);
}
exports.isNullishType = isNullishType;
function isNullableType(type, ts) {
    if (type.isUnion()) {
        return type.types.some((t) => isNullableType(t, ts));
    }
    return isNullType(type, ts) || isUndefinedType(type, ts);
}
exports.isNullableType = isNullableType;
function isBooleanLiteralType(type, ts) {
    return (type.flags & ts.TypeFlags.BooleanLiteral) !== 0;
}
exports.isBooleanLiteralType = isBooleanLiteralType;
function isObjectType(type, ts) {
    return (type.flags & ts.TypeFlags.Object) !== 0;
}
exports.isObjectType = isObjectType;
function isReferenceObjectType(type, ts) {
    return isObjectType(type, ts) && (type.objectFlags & ts.ObjectFlags.Reference) !== 0;
}
exports.isReferenceObjectType = isReferenceObjectType;
function isTupleObjectType(type, ts) {
    return isObjectType(type, ts) && (type.objectFlags & ts.ObjectFlags.Tuple) !== 0;
}
exports.isTupleObjectType = isTupleObjectType;
function isTupleType(type, ts) {
    return (isTupleObjectType(type, ts) ||
        (isReferenceObjectType(type, ts) && isTupleObjectType(type.target, ts)));
}
exports.isTupleType = isTupleType;
function isAnyType(type, ts) {
    return (type.flags & ts.TypeFlags.Any) !== 0;
}
exports.isAnyType = isAnyType;
function isUnknownType(type, ts) {
    return (type.flags & ts.TypeFlags.Unknown) !== 0;
}
exports.isUnknownType = isUnknownType;
function isNeverType(type, ts) {
    return (type.flags & ts.TypeFlags.Never) !== 0;
}
exports.isNeverType = isNeverType;
function isUndefinedType(type, ts) {
    return (type.flags & ts.TypeFlags.Undefined) !== 0;
}
exports.isUndefinedType = isUndefinedType;
function isVoidType(type, ts) {
    return (type.flags & ts.TypeFlags.Void) !== 0;
}
exports.isVoidType = isVoidType;
function isNullType(type, ts) {
    return (type.flags & ts.TypeFlags.Null) !== 0;
}
exports.isNullType = isNullType;
function isPossiblyFalsyType(type, ts) {
    if (type.isUnion()) {
        return type.types.some((t) => isPossiblyFalsyType(t, ts));
    }
    return (type.flags & ts.TypeFlags.PossiblyFalsy) !== 0;
}
exports.isPossiblyFalsyType = isPossiblyFalsyType;
function getCallSignaturesOfType(type) {
    if (type.isUnion()) {
        return type.types.flatMap((t) => getCallSignaturesOfType(t));
    }
    if (type.isIntersection()) {
        let signatures = [];
        for (const t of type.types) {
            const sig = getCallSignaturesOfType(t);
            if (sig.length !== 0) {
                if (signatures.length) {
                    return [];
                }
                signatures = sig;
            }
        }
        return signatures;
    }
    return type.getCallSignatures();
}
exports.getCallSignaturesOfType = getCallSignaturesOfType;
function getConstrainedTypeAtLocation(checker, node) {
    const nodeType = checker.getTypeAtLocation(node);
    const constrained = checker.getBaseConstraintOfType(nodeType);
    return constrained ?? nodeType;
}
exports.getConstrainedTypeAtLocation = getConstrainedTypeAtLocation;
function getTypeName(type, tsTools) {
    const { ts } = tsTools;
    if ((type.flags & ts.TypeFlags.StringLike) !== 0) {
        return 'string';
    }
    const typeChecker = tsTools.service.program.getTypeChecker();
    if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
        const symbol = type.getSymbol();
        const decls = symbol?.getDeclarations();
        const typeParamDecl = decls?.[0];
        if (ts.isTypeParameterDeclaration(typeParamDecl) && typeParamDecl.constraint != null) {
            return getTypeName(typeChecker.getTypeFromTypeNode(typeParamDecl.constraint), tsTools);
        }
    }
    if (type.isUnion() &&
        type.types.map((value) => getTypeName(value, tsTools)).every((t) => t === 'string')) {
        return 'string';
    }
    if (type.isIntersection() &&
        type.types.map((value) => getTypeName(value, tsTools)).some((t) => t === 'string')) {
        return 'string';
    }
    return typeChecker.typeToString(type);
}
exports.getTypeName = getTypeName;
function getTypeOfPropertyOfType(type, name, checker) {
    return checker.getTypeOfPropertyOfType(type, name);
}
exports.getTypeOfPropertyOfType = getTypeOfPropertyOfType;
