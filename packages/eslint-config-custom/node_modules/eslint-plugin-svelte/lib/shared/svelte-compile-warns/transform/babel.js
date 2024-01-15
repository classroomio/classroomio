"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasBabel = exports.transform = void 0;
const load_module_1 = require("../../../utils/load-module");
const compat_1 = require("../../../utils/compat");
function transform(node, text, context) {
    const babel = loadBabel(context);
    if (!babel) {
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
        const output = babel.transformSync(code, {
            sourceType: 'module',
            sourceMaps: true,
            minified: false,
            ast: false,
            code: true,
            cwd: (0, compat_1.getCwd)(context)
        });
        if (!output) {
            return null;
        }
        return {
            inputRange,
            output: output.code,
            mappings: output.map.mappings
        };
    }
    catch (_e) {
        return null;
    }
}
exports.transform = transform;
function hasBabel(context) {
    return Boolean(loadBabel(context));
}
exports.hasBabel = hasBabel;
function loadBabel(context) {
    return (0, load_module_1.loadModule)(context, '@babel/core');
}
