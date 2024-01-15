// src/constants.ts
import path from "path";
var MARKDOWN_EXTENSION_REGEX = /\.mdx?$/;
var MARKDOWN_URL_EXTENSION_REGEX = /\.mdx?(?:(?=[#?])|$)/;
var IS_PRODUCTION = process.env.NODE_ENV === "production";
var LOCALE_REGEX = /\.([a-z]{2}(-[A-Z]{2})?)$/;
var DEFAULT_LOCALE = "en-US";
var DEFAULT_CONFIG = {
  staticImage: true,
  flexsearch: {
    codeblocks: true
  },
  codeHighlight: true
};
var OFFICIAL_THEMES = ["nextra-theme-docs", "nextra-theme-blog"];
var META_FILENAME = "_meta.json";
var DYNAMIC_META_FILENAME = "_meta.js";
var CWD = process.cwd();
var MARKDOWN_EXTENSIONS = ["md", "mdx"];
var PUBLIC_DIR = path.join(CWD, "public");
var EXTERNAL_URL_REGEX = /^https?:\/\//;
var NEXTRA_INTERNAL = Symbol.for("__nextra_internal__");
var CODE_BLOCK_FILENAME_REGEX = /filename="([^"]+)"/;
var DEFAULT_LOCALES = [""];
var ERROR_ROUTES = /* @__PURE__ */ new Set(["/404", "/500"]);
export {
  CODE_BLOCK_FILENAME_REGEX,
  CWD,
  DEFAULT_CONFIG,
  DEFAULT_LOCALE,
  DEFAULT_LOCALES,
  DYNAMIC_META_FILENAME,
  ERROR_ROUTES,
  EXTERNAL_URL_REGEX,
  IS_PRODUCTION,
  LOCALE_REGEX,
  MARKDOWN_EXTENSIONS,
  MARKDOWN_EXTENSION_REGEX,
  MARKDOWN_URL_EXTENSION_REGEX,
  META_FILENAME,
  NEXTRA_INTERNAL,
  OFFICIAL_THEMES,
  PUBLIC_DIR
};
