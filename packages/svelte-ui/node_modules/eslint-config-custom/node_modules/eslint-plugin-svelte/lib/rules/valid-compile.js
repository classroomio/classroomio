"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const svelte_compile_warns_1 = require("../shared/svelte-compile-warns");
const compat_1 = require("../utils/compat");
exports.default = (0, utils_1.createRule)('valid-compile', {
    meta: {
        docs: {
            description: 'disallow warnings when compiling.',
            category: 'Possible Errors',
            recommended: true
        },
        schema: [
            {
                type: 'object',
                properties: {
                    ignoreWarnings: { type: 'boolean' }
                },
                additionalProperties: false
            }
        ],
        messages: {},
        type: 'problem'
    },
    create(context) {
        if (!(0, compat_1.getSourceCode)(context).parserServices.isSvelte) {
            return {};
        }
        const ignoreWarnings = Boolean(context.options[0]?.ignoreWarnings);
        const ignores = ['missing-declaration', 'dynamic-slot-name'];
        function report(warnings) {
            for (const warn of warnings) {
                if (warn.code && ignores.includes(warn.code)) {
                    continue;
                }
                context.report({
                    loc: {
                        start: warn.start || warn.end || { line: 1, column: 0 },
                        end: warn.end || warn.start || { line: 1, column: 0 }
                    },
                    message: `${warn.message}${warn.code ? `(${warn.code})` : ''}`
                });
            }
        }
        return {
            'Program:exit'() {
                const result = (0, svelte_compile_warns_1.getSvelteCompileWarnings)(context);
                if (ignoreWarnings && result.kind === 'warn') {
                    return;
                }
                report(result.warnings);
            }
        };
    }
});
