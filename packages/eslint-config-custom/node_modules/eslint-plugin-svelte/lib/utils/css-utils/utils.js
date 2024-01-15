"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripVendorPrefix = exports.getVendorPrefix = exports.hasVendorPrefix = void 0;
function hasVendorPrefix(prop) {
    return Boolean(getVendorPrefix(prop));
}
exports.hasVendorPrefix = hasVendorPrefix;
function getVendorPrefix(prop) {
    return /^-\w+-/u.exec(prop)?.[0] || '';
}
exports.getVendorPrefix = getVendorPrefix;
function stripVendorPrefix(prop) {
    return prop.slice(getVendorPrefix(prop).length);
}
exports.stripVendorPrefix = stripVendorPrefix;
