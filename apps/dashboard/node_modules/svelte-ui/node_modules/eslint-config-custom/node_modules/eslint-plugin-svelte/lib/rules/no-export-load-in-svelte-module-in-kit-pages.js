"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const svelte_kit_1 = require("../utils/svelte-kit");
exports.default = (0, utils_1.createRule)('no-export-load-in-svelte-module-in-kit-pages', {
    meta: {
        docs: {
            description: 'disallow exporting load functions in `*.svelte` module in SvelteKit page components.',
            category: 'Possible Errors',
            recommended: false
        },
        schema: [],
        messages: {
            unexpected: 'disallow exporting load functions in `*.svelte` module in SvelteKit page components.'
        },
        type: 'problem'
    },
    create(context) {
        if (!(0, svelte_kit_1.isKitPageComponent)(context)) {
            return {};
        }
        let isModule = false;
        return {
            [`Program > SvelteScriptElement > SvelteStartTag > SvelteAttribute[key.name="context"] > SvelteLiteral[value="module"]`]: () => {
                isModule = true;
            },
            'Program > SvelteScriptElement:exit': () => {
                isModule = false;
            },
            [`:matches(ExportNamedDeclaration > FunctionDeclaration, ExportNamedDeclaration > VariableDeclaration > VariableDeclarator) > Identifier.id[name="load"]`]: (node) => {
                if (!isModule)
                    return {};
                return context.report({
                    node,
                    loc: node.loc,
                    messageId: 'unexpected'
                });
            }
        };
    }
});
