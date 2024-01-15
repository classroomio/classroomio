"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/catch-all.ts
var catch_all_exports = {};
__export(catch_all_exports, {
  createCatchAllMeta: () => createCatchAllMeta
});
module.exports = __toCommonJS(catch_all_exports);

// src/constants.ts
var import_node_path = __toESM(require("path"));
var MARKDOWN_EXTENSION_REGEX = /\.mdx?$/;
var IS_PRODUCTION = process.env.NODE_ENV === "production";
var CWD = process.cwd();
var PUBLIC_DIR = import_node_path.default.join(CWD, "public");
var NEXTRA_INTERNAL = Symbol.for("__nextra_internal__");

// src/catch-all.ts
function appendSlashForFolders(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const isFolder = value && typeof value === "object" && value.type === "folder";
      return isFolder ? [`${key}/`, value] : [key, value];
    })
  );
}
function createCatchAllMeta(filePaths, customMeta = /* @__PURE__ */ Object.create(null)) {
  const metaMap = appendSlashForFolders(customMeta);
  const paths = filePaths.filter((filePath) => MARKDOWN_EXTENSION_REGEX.test(filePath)).map((filePath) => filePath.replace(MARKDOWN_EXTENSION_REGEX, "").split("/"));
  for (const path2 of paths) {
    addToMap(metaMap, path2);
  }
  function addToMap(meta, path2) {
    var _a;
    const isPage = path2.length === 1;
    const [name, ...rest] = path2;
    if (isPage) {
      meta[name] || (meta[name] = "");
      return;
    }
    meta[_a = `${name}/`] || (meta[_a] = {});
    const folder = meta[`${name}/`];
    folder.items || (folder.items = {});
    folder.type || (folder.type = "folder");
    if (Object.hasOwn(meta, name) && typeof folder.title === "string") {
      const metaItem = meta[name];
      if (typeof metaItem === "string") {
        meta[name] = folder.title;
      } else {
        metaItem.title = folder.title;
      }
    }
    addToMap(folder.items, rest);
  }
  return metaMap;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCatchAllMeta
});
