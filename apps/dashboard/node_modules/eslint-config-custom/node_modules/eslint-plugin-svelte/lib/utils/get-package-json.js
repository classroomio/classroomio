"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageJson = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache_1 = require("./cache");
const isRunOnBrowser = !fs_1.default.readFileSync;
const cache = (0, cache_1.createCache)();
function readPackageJson(dir) {
    if (isRunOnBrowser)
        return null;
    const filePath = path_1.default.join(dir, 'package.json');
    try {
        const text = fs_1.default.readFileSync(filePath, 'utf8');
        const data = JSON.parse(text);
        if (typeof data === 'object' && data !== null) {
            data.filePath = filePath;
            return data;
        }
    }
    catch (_err) {
    }
    return null;
}
function getPackageJson(startPath = 'a.js') {
    if (isRunOnBrowser)
        return null;
    const startDir = path_1.default.dirname(path_1.default.resolve(startPath));
    let dir = startDir;
    let prevDir = '';
    let data = null;
    do {
        data = cache.get(dir);
        if (data) {
            if (dir !== startDir) {
                cache.set(startDir, data);
            }
            return data;
        }
        data = readPackageJson(dir);
        if (data) {
            cache.set(dir, data);
            cache.set(startDir, data);
            return data;
        }
        prevDir = dir;
        dir = path_1.default.resolve(dir, '..');
    } while (dir !== prevDir);
    cache.set(startDir, null);
    return null;
}
exports.getPackageJson = getPackageJson;
