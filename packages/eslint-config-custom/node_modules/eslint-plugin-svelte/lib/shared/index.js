"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShared = exports.terminateShared = exports.beginShared = exports.Shared = void 0;
const comment_directives_1 = require("./comment-directives");
class Shared {
    constructor() {
        this.commentDirectives = [];
    }
    newCommentDirectives(options) {
        const directives = new comment_directives_1.CommentDirectives(options);
        this.commentDirectives.push(directives);
        return directives;
    }
}
exports.Shared = Shared;
const sharedMap = new Map();
function beginShared(filename) {
    sharedMap.set(filename, new Shared());
}
exports.beginShared = beginShared;
function terminateShared(filename) {
    const result = sharedMap.get(filename);
    sharedMap.delete(filename);
    return result ?? null;
}
exports.terminateShared = terminateShared;
function getShared(filename) {
    return sharedMap.get(filename) ?? null;
}
exports.getShared = getShared;
