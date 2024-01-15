"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTypeScript = exports.transform = void 0;
const load_module_1 = require("../../../utils/load-module");
const compat_1 = require("../../../utils/compat");
function transform(node, text, context) {
    const ts = loadTs(context);
    if (!ts) {
        return null;
    }
    let inputRange;
    if (node.endTag) {
        inputRange = [node.startTag.range[1], node.endTag.range[0]];
    }
    else {
        inputRange = [node.startTag.range[1], node.range[1]];
    }
    const code = text.slice(...inputRange);
    try {
        const output = ts.transpileModule(code, {
            reportDiagnostics: false,
            compilerOptions: {
                target: (0, compat_1.getSourceCode)(context).parserServices.program?.getCompilerOptions()?.target ||
                    ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
                importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Preserve,
                sourceMap: true
            }
        });
        return {
            inputRange,
            output: output.outputText,
            mappings: JSON.parse(output.sourceMapText).mappings
        };
    }
    catch {
        return null;
    }
}
exports.transform = transform;
function hasTypeScript(context) {
    return Boolean(loadTs(context));
}
exports.hasTypeScript = hasTypeScript;
function loadTs(context) {
    return (0, load_module_1.loadModule)(context, 'typescript');
}
