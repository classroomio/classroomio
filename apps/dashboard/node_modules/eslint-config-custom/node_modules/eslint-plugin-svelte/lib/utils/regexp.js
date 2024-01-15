"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRegExp = exports.toRegExp = void 0;
const RE_REGEXP_STR = /^\/(.+)\/([A-Za-z]*)$/u;
function toRegExp(string) {
    const parts = RE_REGEXP_STR.exec(string);
    if (parts) {
        return new RegExp(parts[1], parts[2]);
    }
    return { test: (s) => s === string };
}
exports.toRegExp = toRegExp;
function isRegExp(string) {
    return Boolean(RE_REGEXP_STR.test(string));
}
exports.isRegExp = isRegExp;
