"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineVisitor = void 0;
const ast_1 = require("./ast");
const commons_1 = require("./commons");
const commons_2 = require("./commons");
const commons_3 = require("./commons");
const PREFORMATTED_ELEMENT_NAMES = ['pre', 'textarea', 'template'];
function defineVisitor(context) {
    const { sourceCode, offsets, options } = context;
    const visitor = {
        SvelteScriptElement(node) {
            offsets.setOffsetElementList(node.body, node.startTag, node.endTag, options.indentScript ? 1 : 0);
        },
        SvelteStyleElement(node) {
            node.children.forEach((n) => offsets.ignore(n));
        },
        SvelteElement(node) {
            if (node.name.type === 'Identifier' || node.name.type === 'SvelteName') {
                if (PREFORMATTED_ELEMENT_NAMES.includes(node.name.name)) {
                    const startTagToken = sourceCode.getFirstToken(node);
                    const endTagToken = node.endTag && sourceCode.getFirstToken(node.endTag);
                    offsets.setOffsetToken(endTagToken, 0, startTagToken);
                    node.children.forEach((n) => offsets.ignore(n));
                    return;
                }
                if (node.name.name === 'style') {
                    node.children.forEach((n) => offsets.ignore(n));
                    return;
                }
            }
            if (node.endTag) {
                offsets.setOffsetElementList(node.children.filter(isNotEmptyTextNode), node.startTag, node.endTag, 1);
            }
        },
        SvelteStartTag(node) {
            const openToken = sourceCode.getFirstToken(node);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetElementList(node.attributes, openToken, closeToken, 1, options.alignAttributesVertically);
            if (node.selfClosing) {
                const slash = sourceCode.getTokenBefore(closeToken);
                if (slash.value === '/') {
                    offsets.setOffsetToken(slash, 0, openToken);
                }
            }
        },
        SvelteEndTag(node) {
            const openToken = sourceCode.getFirstToken(node);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetElementList([], openToken, closeToken, 1);
        },
        SvelteAttribute(node) {
            const keyToken = sourceCode.getFirstToken(node);
            const eqToken = sourceCode.getTokenAfter(node.key);
            if (eqToken != null && eqToken.range[1] <= node.range[1]) {
                offsets.setOffsetToken(eqToken, 1, keyToken);
                const valueStartToken = sourceCode.getTokenAfter(eqToken);
                if (valueStartToken != null && valueStartToken.range[1] <= node.range[1]) {
                    offsets.setOffsetToken(valueStartToken, 1, keyToken);
                    const values = node.type === 'SvelteAttribute' || node.type === 'SvelteStyleDirective'
                        ? node.value
                        : [];
                    let processedValues = false;
                    if (valueStartToken.type === 'Punctuator') {
                        const quoted = ['"', "'"].includes(valueStartToken.value);
                        const mustache = !quoted && valueStartToken.value === '{';
                        if (quoted || mustache) {
                            const last = sourceCode.getLastToken(node);
                            if (last.type === 'Punctuator' &&
                                ((quoted && last.value === valueStartToken.value) ||
                                    (mustache && last.value === '}'))) {
                                offsets.setOffsetToken(last, 0, valueStartToken);
                                offsets.setOffsetElementList(values, valueStartToken, last, 1);
                                processedValues = true;
                            }
                        }
                    }
                    if (!processedValues) {
                        for (const val of values) {
                            const token = sourceCode.getFirstToken(val);
                            offsets.setOffsetToken(token, 0, valueStartToken);
                        }
                    }
                }
            }
        },
        SvelteDirective(node) {
            visitor.SvelteAttribute(node);
        },
        SvelteStyleDirective(node) {
            visitor.SvelteAttribute(node);
        },
        SvelteSpecialDirective(node) {
            visitor.SvelteAttribute(node);
        },
        SvelteShorthandAttribute(node) {
            const openToken = sourceCode.getFirstToken(node);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetElementList([], openToken, closeToken, 1);
        },
        SvelteSpreadAttribute(node) {
            visitor.SvelteShorthandAttribute(node);
        },
        SvelteDirectiveKey(_node) {
        },
        SvelteSpecialDirectiveKey(_node) {
        },
        SvelteText(node) {
            const tokens = sourceCode.getTokens(node, {
                filter: ast_1.isNotWhitespace,
                includeComments: false
            });
            const first = tokens.shift();
            if (!first) {
                return;
            }
            offsets.setOffsetToken(tokens, (0, commons_2.isBeginningOfLine)(sourceCode, first) ? 0 : (0, commons_1.isBeginningOfElement)(node) ? 1 : 0, first);
        },
        SvelteLiteral(node) {
            const tokens = sourceCode.getTokens(node, {
                filter: ast_1.isNotWhitespace,
                includeComments: false
            });
            const first = tokens.shift();
            if (!first) {
                return;
            }
            offsets.setOffsetToken(tokens, (0, commons_2.isBeginningOfLine)(sourceCode, first) ? 0 : 1, first);
        },
        SvelteMustacheTag(node) {
            const openToken = sourceCode.getFirstToken(node);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetElementList([node.expression], openToken, closeToken, 1);
        },
        SvelteDebugTag(node) {
            const openToken = sourceCode.getFirstToken(node);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetElementList(node.identifiers, openToken, closeToken, 1);
        },
        SvelteConstTag(node) {
            const openToken = sourceCode.getFirstToken(node);
            const constToken = sourceCode.getTokenAfter(openToken);
            const declarationToken = sourceCode.getFirstToken(node.declaration);
            const closeToken = sourceCode.getLastToken(node);
            offsets.setOffsetToken(constToken, 1, openToken);
            offsets.setOffsetToken(declarationToken, 1, openToken);
            offsets.setOffsetToken(closeToken, 0, openToken);
        },
        SvelteIfBlock(node) {
            const [openToken, ...ifTokens] = sourceCode.getFirstTokens(node, {
                count: node.elseif ? 3 : 2,
                includeComments: false
            });
            offsets.setOffsetToken(ifTokens, 1, openToken);
            const exp = (0, commons_3.getFirstAndLastTokens)(sourceCode, node.expression);
            offsets.setOffsetToken(exp.firstToken, 1, ifTokens[0]);
            const closeOpenTagToken = sourceCode.getTokenAfter(exp.lastToken);
            offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
            if (node.else) {
                offsets.setOffsetToken(sourceCode.getFirstToken(node.else), 0, openToken);
                if (node.else.elseif) {
                    return;
                }
            }
            const [openCloseTagToken, endIfToken, closeCloseTagToken] = sourceCode.getLastTokens(node, {
                count: 3,
                includeComments: false
            });
            offsets.setOffsetToken(openCloseTagToken, 0, openToken);
            offsets.setOffsetToken(endIfToken, 1, openCloseTagToken);
            offsets.setOffsetToken(closeCloseTagToken, 0, openCloseTagToken);
        },
        SvelteElseBlock(node) {
            if (node.elseif) {
                return;
            }
            const [openToken, elseToken, closeToken] = sourceCode.getFirstTokens(node, {
                count: 3,
                includeComments: false
            });
            offsets.setOffsetToken(elseToken, 1, openToken);
            offsets.setOffsetToken(closeToken, 0, openToken);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
        },
        SvelteEachBlock(node) {
            const [openToken, eachToken] = sourceCode.getFirstTokens(node, {
                count: 2,
                includeComments: false
            });
            offsets.setOffsetToken(eachToken, 1, openToken);
            offsets.setOffsetElementList([node.expression, node.context, node.index], eachToken, null, 1);
            if (node.key) {
                const key = (0, commons_3.getFirstAndLastTokens)(sourceCode, node.key);
                offsets.setOffsetToken(key.firstToken, 1, eachToken);
                const closeOpenTagToken = sourceCode.getTokenAfter(key.lastToken);
                offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            }
            else {
                const closeOpenTagToken = sourceCode.getTokenAfter(node.index || node.context);
                offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            }
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
            if (node.else) {
                offsets.setOffsetToken(sourceCode.getFirstToken(node.else), 0, openToken);
            }
            const [openCloseTagToken, endEachToken, closeCloseTagToken] = sourceCode.getLastTokens(node, {
                count: 3,
                includeComments: false
            });
            offsets.setOffsetToken(openCloseTagToken, 0, openToken);
            offsets.setOffsetToken(endEachToken, 1, openCloseTagToken);
            offsets.setOffsetToken(closeCloseTagToken, 0, openCloseTagToken);
        },
        SvelteAwaitBlock(node) {
            const [openToken, awaitToken] = sourceCode.getFirstTokens(node, {
                count: 2,
                includeComments: false
            });
            offsets.setOffsetToken(awaitToken, 1, openToken);
            const exp = (0, commons_3.getFirstAndLastTokens)(sourceCode, node.expression);
            offsets.setOffsetToken(exp.firstToken, 1, awaitToken);
            if (node.pending) {
                const closeOpenTagToken = sourceCode.getTokenAfter(exp.lastToken);
                offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
                offsets.setOffsetToken(sourceCode.getFirstToken(node.pending, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                }), 1, openToken);
            }
            if (node.then) {
                if (node.kind === 'await-then') {
                    const thenToken = sourceCode.getTokenAfter(exp.lastToken);
                    offsets.setOffsetToken(thenToken, 1, openToken);
                    if (node.then.value) {
                        offsets.setOffsetToken(sourceCode.getFirstToken(node.then.value), 1, thenToken);
                    }
                    const closeOpenTagToken = sourceCode.getTokenAfter(node.then.value || thenToken);
                    offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
                }
                else {
                    offsets.setOffsetToken(sourceCode.getFirstToken(node.then), 0, openToken);
                }
            }
            if (node.catch) {
                if (node.kind === 'await-catch') {
                    const catchToken = sourceCode.getTokenAfter(exp.lastToken);
                    offsets.setOffsetToken(catchToken, 1, openToken);
                    if (node.catch.error) {
                        offsets.setOffsetToken(sourceCode.getFirstToken(node.catch.error), 1, catchToken);
                    }
                    const closeOpenTagToken = sourceCode.getTokenAfter(node.catch.error || catchToken);
                    offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
                }
                else {
                    offsets.setOffsetToken(sourceCode.getFirstToken(node.catch), 0, openToken);
                }
            }
            const [openCloseTagToken, endAwaitToken, closeCloseTagToken] = sourceCode.getLastTokens(node, {
                count: 3,
                includeComments: false
            });
            offsets.setOffsetToken(openCloseTagToken, 0, openToken);
            offsets.setOffsetToken(endAwaitToken, 1, openCloseTagToken);
            offsets.setOffsetToken(closeCloseTagToken, 0, openCloseTagToken);
        },
        SvelteAwaitPendingBlock(node) {
            const openToken = sourceCode.getFirstToken(node);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
        },
        SvelteAwaitThenBlock(node) {
            if (!node.awaitThen) {
                const [openToken, thenToken] = sourceCode.getFirstTokens(node, {
                    count: 2,
                    includeComments: false
                });
                offsets.setOffsetToken(thenToken, 1, openToken);
                if (node.value) {
                    const valueToken = sourceCode.getFirstToken(node.value);
                    offsets.setOffsetToken(valueToken, 1, thenToken);
                }
                const closeOpenTagToken = sourceCode.getTokenAfter(node.value || thenToken);
                offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            }
            const openToken = sourceCode.getFirstToken(node);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
        },
        SvelteAwaitCatchBlock(node) {
            if (!node.awaitCatch) {
                const [openToken, catchToken] = sourceCode.getFirstTokens(node, {
                    count: 2,
                    includeComments: false
                });
                offsets.setOffsetToken(catchToken, 1, openToken);
                if (node.error) {
                    const errorToken = sourceCode.getFirstToken(node.error);
                    offsets.setOffsetToken(errorToken, 1, catchToken);
                }
                const closeOpenTagToken = sourceCode.getTokenAfter(node.error || catchToken);
                offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            }
            const openToken = sourceCode.getFirstToken(node);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
        },
        SvelteKeyBlock(node) {
            const [openToken, keyToken] = sourceCode.getFirstTokens(node, {
                count: 2,
                includeComments: false
            });
            offsets.setOffsetToken(keyToken, 1, openToken);
            const exp = (0, commons_3.getFirstAndLastTokens)(sourceCode, node.expression);
            offsets.setOffsetToken(exp.firstToken, 1, keyToken);
            const closeOpenTagToken = sourceCode.getTokenAfter(exp.lastToken);
            offsets.setOffsetToken(closeOpenTagToken, 0, openToken);
            for (const child of node.children) {
                const token = sourceCode.getFirstToken(child, {
                    includeComments: false,
                    filter: ast_1.isNotWhitespace
                });
                offsets.setOffsetToken(token, 1, openToken);
            }
            const [openCloseTagToken, endAwaitToken, closeCloseTagToken] = sourceCode.getLastTokens(node, {
                count: 3,
                includeComments: false
            });
            offsets.setOffsetToken(openCloseTagToken, 0, openToken);
            offsets.setOffsetToken(endAwaitToken, 1, openCloseTagToken);
            offsets.setOffsetToken(closeCloseTagToken, 0, openCloseTagToken);
        },
        SvelteHTMLComment(_node) {
        },
        SvelteName(_node) {
        },
        SvelteMemberExpressionName(_node) {
        }
    };
    return visitor;
}
exports.defineVisitor = defineVisitor;
function isNotEmptyTextNode(node) {
    return !(node.type === 'SvelteText' && node.value.trim() === '');
}
