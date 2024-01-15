"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
function createRule(ruleName, rule) {
    return {
        meta: {
            ...rule.meta,
            docs: {
                ...rule.meta.docs,
                url: `https://sveltejs.github.io/eslint-plugin-svelte/rules/${ruleName}/`,
                ruleId: `svelte/${ruleName}`,
                ruleName
            }
        },
        create: rule.create
    };
}
exports.createRule = createRule;
