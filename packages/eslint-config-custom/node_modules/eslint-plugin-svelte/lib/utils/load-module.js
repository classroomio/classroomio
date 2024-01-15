"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModulesForBrowser = exports.loadModule = void 0;
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const compat_1 = require("./compat");
const cache = new WeakMap();
const cache4b = new Map();
function loadModule(context, name) {
    const key = (0, compat_1.getSourceCode)(context).ast;
    let modules = cache.get(key);
    if (!modules) {
        modules = {};
        cache.set(key, modules);
    }
    const mod = modules[name] || cache4b.get(name);
    if (mod)
        return mod;
    try {
        const cwd = (0, compat_1.getCwd)(context);
        const relativeTo = path_1.default.join(cwd, '__placeholder__.js');
        return (modules[name] = module_1.default.createRequire(relativeTo)(name));
    }
    catch {
    }
    for (const relativeTo of [
        (0, compat_1.getFilename)(context),
        (0, compat_1.getPhysicalFilename)(context),
        typeof __filename !== 'undefined' ? __filename : ''
    ]) {
        if (relativeTo) {
            try {
                return (modules[name] = module_1.default.createRequire(relativeTo)(name));
            }
            catch {
            }
        }
    }
    return null;
}
exports.loadModule = loadModule;
async function loadModulesForBrowser() {
    const [sass, typescript] = await Promise.all([import('sass'), import('typescript')]);
    cache4b.set('sass', sass);
    cache4b.set('typescript', typescript);
}
exports.loadModulesForBrowser = loadModulesForBrowser;
