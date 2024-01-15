"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKitPageComponent = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const get_package_json_1 = require("./get-package-json");
const compat_1 = require("./compat");
const isRunOnBrowser = !fs_1.default.readFileSync;
function isKitPageComponent(context) {
    if (isRunOnBrowser)
        return true;
    if (!hasSvelteKit((0, compat_1.getFilename)(context)))
        return false;
    const routes = context.settings?.svelte?.kit?.files?.routes?.replace(/^\//, '') ?? 'src/routes';
    const filePath = (0, compat_1.getFilename)(context);
    const projectRootDir = getProjectRootDir((0, compat_1.getFilename)(context)) ?? '';
    const fileName = path_1.default.basename(filePath);
    return (filePath.startsWith(path_1.default.join(projectRootDir, routes)) &&
        Boolean(/^\+.+\.svelte$/.test(fileName)));
}
exports.isKitPageComponent = isKitPageComponent;
function hasSvelteKit(filePath) {
    if (isRunOnBrowser)
        return true;
    try {
        const packageJson = (0, get_package_json_1.getPackageJson)(filePath);
        if (!packageJson)
            return false;
        if (packageJson.name === 'eslint-plugin-svelte')
            return true;
        return Boolean(packageJson.dependencies?.['@sveltejs/kit'] ?? packageJson.devDependencies?.['@sveltejs/kit']);
    }
    catch (_e) {
        return false;
    }
}
function getProjectRootDir(filePath) {
    if (isRunOnBrowser)
        return null;
    const packageJsonFilePath = (0, get_package_json_1.getPackageJson)(filePath)?.filePath;
    if (!packageJsonFilePath)
        return null;
    return path_1.default.dirname(path_1.default.resolve(packageJsonFilePath));
}
