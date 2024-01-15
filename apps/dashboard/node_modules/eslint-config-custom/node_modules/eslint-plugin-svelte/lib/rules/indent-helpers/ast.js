"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotWhitespace = exports.isWhitespace = void 0;
function isWhitespace(token) {
    return (token != null &&
        ((token.type === 'HTMLText' && !token.value.trim()) ||
            (token.type === 'JSXText' && !token.value.trim())));
}
exports.isWhitespace = isWhitespace;
function isNotWhitespace(token) {
    return (token != null &&
        (token.type !== 'HTMLText' || Boolean(token.value.trim())) &&
        (token.type !== 'JSXText' || Boolean(token.value.trim())));
}
exports.isNotWhitespace = isNotWhitespace;
