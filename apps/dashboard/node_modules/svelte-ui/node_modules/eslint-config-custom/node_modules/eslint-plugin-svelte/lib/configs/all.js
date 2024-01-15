"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const rules_1 = require("../utils/rules");
const base = require.resolve('./base');
const baseExtend = path_1.default.extname(`${base}`) === '.ts' ? 'plugin:svelte/base' : base;
module.exports = {
    extends: [baseExtend],
    rules: Object.fromEntries(rules_1.rules
        .map((rule) => [`svelte/${rule.meta.docs.ruleName}`, 'error'])
        .filter(([ruleName]) => ![
        'svelte/no-restricted-html-elements'
    ].includes(ruleName)))
};
