"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLeadingComments = void 0;
const eslint_utils_1 = require("@eslint-community/eslint-utils");
const compat_1 = require("../../utils/compat");
function extractLeadingComments(context, node) {
    const sourceCode = (0, compat_1.getSourceCode)(context);
    const beforeToken = sourceCode.getTokenBefore(node, {
        includeComments: false,
        filter(token) {
            if ((0, eslint_utils_1.isOpeningParenToken)(token)) {
                return false;
            }
            const astToken = token;
            if (astToken.type === 'HTMLText') {
                return false;
            }
            return astToken.type !== 'HTMLComment';
        }
    });
    if (beforeToken) {
        return sourceCode
            .getTokensBetween(beforeToken, node, { includeComments: true })
            .filter(isComment);
    }
    return sourceCode.getTokensBefore(node, { includeComments: true }).filter(isComment);
}
exports.extractLeadingComments = extractLeadingComments;
function isComment(token) {
    return token.type === 'HTMLComment' || token.type === 'Block' || token.type === 'Line';
}
