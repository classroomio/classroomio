"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSvelteIgnoreItems = void 0;
const compat_1 = require("../../utils/compat");
const SVELTE_IGNORE_PATTERN = /^\s*svelte-ignore/m;
function getSvelteIgnoreItems(context) {
    const sourceCode = (0, compat_1.getSourceCode)(context);
    const ignoreComments = [];
    for (const comment of sourceCode.getAllComments()) {
        const ignores = extractSvelteIgnore(comment.value, comment.range[0] + 2, comment);
        if (ignores) {
            ignoreComments.push(...ignores);
        }
        else if (hasMissingCodeIgnore(comment.value)) {
            ignoreComments.push({
                range: comment.range,
                code: null,
                token: comment
            });
        }
    }
    for (const token of sourceCode.ast.tokens) {
        if (token.type === 'HTMLComment') {
            const text = token.value.slice(4, -3);
            const ignores = extractSvelteIgnore(text, token.range[0] + 4, token);
            if (ignores) {
                ignoreComments.push(...ignores);
            }
            else if (hasMissingCodeIgnore(text)) {
                ignoreComments.push({
                    range: token.range,
                    code: null,
                    token
                });
            }
        }
    }
    ignoreComments.sort((a, b) => b.range[0] - a.range[0]);
    return ignoreComments;
}
exports.getSvelteIgnoreItems = getSvelteIgnoreItems;
function extractSvelteIgnore(text, startIndex, token) {
    const m1 = SVELTE_IGNORE_PATTERN.exec(text);
    if (!m1) {
        return null;
    }
    const ignoreStart = m1.index + m1[0].length;
    const beforeText = text.slice(ignoreStart);
    if (!/^\s/.test(beforeText) || !beforeText.trim()) {
        return null;
    }
    let start = startIndex + ignoreStart;
    const results = [];
    for (const code of beforeText.split(/\s/)) {
        const end = start + code.length;
        const trimmed = code.trim();
        if (trimmed) {
            results.push({
                code: trimmed,
                range: [start, end],
                token
            });
        }
        start = end + 1;
    }
    return results;
}
function hasMissingCodeIgnore(text) {
    const m1 = SVELTE_IGNORE_PATTERN.exec(text);
    if (!m1) {
        return false;
    }
    const ignoreStart = m1.index + m1[0].length;
    const beforeText = text.slice(ignoreStart);
    return !beforeText.trim();
}
