"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/constants.ts
var import_node_path = __toESM(require("path"));
var MARKDOWN_EXTENSION_REGEX = /\.mdx?$/;
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
var META_FILENAME = "_meta.json";
var DYNAMIC_META_FILENAME = "_meta.js";
var CWD = process.cwd();
var MARKDOWN_EXTENSIONS = ["md", "mdx"];
var PUBLIC_DIR = import_node_path.default.join(CWD, "public");
var NEXTRA_INTERNAL = Symbol.for("__nextra_internal__");
var DEFAULT_LOCALES = [""];

// src/utils.ts
var import_node_path2 = __toESM(require("path"));
var import_slash = __toESM(require("slash"));
var import_title = __toESM(require("title"));
function parseFileName(filePath) {
  var _a;
  const { name, ext } = import_node_path2.default.parse(filePath);
  const locale = ((_a = name.match(LOCALE_REGEX)) == null ? void 0 : _a[1]) || "";
  return {
    name: locale ? name.replace(LOCALE_REGEX, "") : name,
    locale,
    ext
  };
}
function truthy(value) {
  return !!value;
}
function normalizePageRoute(parentRoute, route) {
  return (0, import_slash.default)(import_node_path2.default.join(parentRoute, route.replace(/^index$/, "")));
}
function pageTitleFromFilename(fileName) {
  return (0, import_title.default)(fileName.replaceAll(/[-_]/g, " "));
}
function sortPages(pages, locale) {
  if (locale === "") {
    locale = void 0;
  }
  return pages.filter((item) => item.kind === "Folder" || item.locale === locale).map((item) => {
    var _a, _b;
    return {
      name: item.name,
      date: "frontMatter" in item && ((_a = item.frontMatter) == null ? void 0 : _a.date),
      title: "frontMatter" in item && ((_b = item.frontMatter) == null ? void 0 : _b.title) || pageTitleFromFilename(item.name)
    };
  }).sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (a.date) {
      return -1;
    }
    if (b.date) {
      return 1;
    }
    return a.title.localeCompare(b.title, locale, { numeric: true });
  }).map((item) => [item.name, item.title]);
}
function isSerializable(o) {
  try {
    JSON.stringify(o);
    return true;
  } catch (err) {
    return false;
  }
}
function getDefault(module2) {
  return module2.default || module2;
}

// src/page-map.ts
var PageMapCache = class {
  constructor() {
    this.cache = {
      items: [],
      fileMap: /* @__PURE__ */ Object.create(null)
    };
  }
  set(data) {
    this.cache.items = data.items;
    this.cache.fileMap = data.fileMap;
  }
  clear() {
    this.cache = null;
  }
  get() {
    return this.cache;
  }
};
var pageMapCache = new PageMapCache();

// src/file-system.ts
var import_graceful_fs = __toESM(require("graceful-fs"));
var findPagesDirImport = __toESM(require("next/dist/lib/find-pages-dir.js"));
var { findPagesDir } = getDefault(findPagesDirImport);
var { existsSync } = import_graceful_fs.default;
function findPagesDirectory() {
  const res = findPagesDir(CWD);
  return res.pagesDir || // next v13
  res.pages;
}
var PAGES_DIR = process.env.VITEST_WORKER_ID ? "" : findPagesDirectory();

// src/plugin.ts
var import_node_path3 = __toESM(require("path"));
var import_node_util = require("util");
var import_graceful_fs2 = __toESM(require("graceful-fs"));
var import_gray_matter = __toESM(require("gray-matter"));
var import_p_limit = __toESM(require("p-limit"));
var readdir = (0, import_node_util.promisify)(import_graceful_fs2.default.readdir);
var readFile = (0, import_node_util.promisify)(import_graceful_fs2.default.readFile);
var realpath = (0, import_node_util.promisify)(import_graceful_fs2.default.realpath);
var stat = (0, import_node_util.promisify)(import_graceful_fs2.default.stat);
var collectMdx = (filePath, route = "") => __async(void 0, null, function* () {
  const { name, locale } = parseFileName(filePath);
  const content = yield readFile(filePath, "utf8");
  const { data } = (0, import_gray_matter.default)(content);
  return __spreadValues(__spreadValues({
    kind: "MdxPage",
    name,
    route
  }, locale && { locale }), Object.keys(data).length && { frontMatter: data });
});
var limit = (0, import_p_limit.default)(20);
function collectFiles(_0) {
  return __async(this, arguments, function* ({
    dir,
    locales = DEFAULT_LOCALES,
    route = "/",
    fileMap = /* @__PURE__ */ Object.create(null),
    isFollowingSymlink = false
  }) {
    var _a;
    const files = yield readdir(dir, { withFileTypes: true });
    const promises = files.map((f) => __async(this, null, function* () {
      const filePath = import_node_path3.default.join(dir, f.name);
      let isDirectory = f.isDirectory();
      const isSymlinked = isFollowingSymlink || f.isSymbolicLink();
      let symlinkSource;
      if (isSymlinked) {
        symlinkSource = yield realpath(filePath);
        const stats = yield stat(filePath);
        if (stats.isDirectory()) {
          isDirectory = true;
        }
      }
      const { name, locale, ext } = isDirectory ? (
        // directory couldn't have extensions
        { name: import_node_path3.default.basename(filePath), locale: "", ext: "" }
      ) : parseFileName(filePath);
      if (name.startsWith("["))
        return;
      const fileRoute = normalizePageRoute(route, name);
      if (isDirectory) {
        if (fileRoute === "/api")
          return;
        const { items: items2 } = yield collectFiles({
          dir: filePath,
          locales,
          route: fileRoute,
          fileMap,
          isFollowingSymlink: isSymlinked
        });
        if (!items2.length)
          return;
        return {
          kind: "Folder",
          name: f.name,
          route: fileRoute,
          children: items2
        };
      }
      return limit(() => __async(this, null, function* () {
        if (MARKDOWN_EXTENSION_REGEX.test(ext)) {
          if (fileRoute === "/_app")
            return;
          const fp = filePath;
          fileMap[fp] = yield collectMdx(fp, fileRoute);
          if (symlinkSource) {
            fileMap[symlinkSource] = __spreadValues({}, fileMap[fp]);
          }
          return fileMap[fp];
        }
        const fileName = name + ext;
        try {
          if (fileName === META_FILENAME) {
            const fp = filePath;
            const content = yield readFile(fp, "utf8");
            fileMap[fp] = __spreadProps(__spreadValues({
              kind: "Meta"
            }, locale && { locale }), {
              data: JSON.parse(content)
            });
            return fileMap[fp];
          }
          if (fileName === DYNAMIC_META_FILENAME) {
            const importPath = `${filePath}?d=${Date.now()}`;
            const metaMod = yield import(importPath);
            const meta = metaMod.default;
            const fp = filePath.replace(/\.js$/, ".json");
            if (typeof meta === "function") {
              fileMap[fp] = __spreadProps(__spreadValues({
                kind: "Meta"
              }, locale && { locale }), {
                __nextra_src: filePath,
                data: {}
              });
            } else if (meta && typeof meta === "object" && isSerializable(meta)) {
              fileMap[fp] = __spreadProps(__spreadValues({
                kind: "Meta"
              }, locale && { locale }), {
                // we spread object because default title could be incorrectly set when _meta.json/js
                // is imported/exported by another _meta.js
                data: __spreadValues({}, meta)
              });
            } else {
              console.error(
                `[nextra] "${fileName}" is not a valid meta file. The default export is required to be a serializable object or a function. Please check the following file:`,
                import_node_path3.default.relative(CWD, filePath)
              );
            }
            return fileMap[fp];
          }
        } catch (err) {
          const relPath = import_node_path3.default.relative(CWD, filePath);
          console.error(
            `[nextra] Error loading ${relPath}
${err.name}: ${err.message}`
          );
        }
        if (fileName === "meta.json") {
          console.warn(
            '[nextra] "meta.json" was renamed to "_meta.json". Rename the following file:',
            import_node_path3.default.relative(CWD, filePath)
          );
        } else if (/_meta\.(jsx|ts|tsx|cjs|mjs)$/.test(fileName)) {
          console.error(
            `[nextra] "${fileName}" is not currently supported, please rename the following file to "${DYNAMIC_META_FILENAME}":`,
            import_node_path3.default.relative(CWD, filePath)
          );
        }
      }));
    }));
    const items = (yield Promise.all(promises)).filter(truthy);
    const mdxPages = [];
    const metaLocaleIndexes = /* @__PURE__ */ new Map();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "MdxPage") {
        mdxPages.push(item);
      } else if (item.kind === "Meta") {
        metaLocaleIndexes.set(item.locale || "", i);
      }
    }
    for (const locale of locales) {
      let metaIndex = metaLocaleIndexes.get(locale);
      const defaultMeta = sortPages(mdxPages, locale);
      const metaFilename = locale ? META_FILENAME.replace(".", `.${locale}.`) : META_FILENAME;
      const metaPath = import_node_path3.default.join(dir, metaFilename);
      if (metaIndex === void 0 && defaultMeta.length > 0) {
        const meta = __spreadProps(__spreadValues({
          kind: "Meta"
        }, locale && { locale }), {
          data: Object.fromEntries(defaultMeta)
        });
        fileMap[metaPath] = meta;
        items.push(meta);
        metaIndex = items.length - 1;
      }
      if (metaIndex !== void 0) {
        const meta = __spreadValues({}, items[metaIndex]);
        for (const [key, capitalizedTitle] of defaultMeta) {
          (_a = meta.data)[key] || (_a[key] = capitalizedTitle);
          const metaItem = meta.data[key];
          if (typeof metaItem === "object") {
            metaItem.title || (metaItem.title = capitalizedTitle);
          }
        }
        fileMap[metaPath] = meta;
        items[metaIndex] = meta;
      }
    }
    return { items, fileMap };
  });
}

// src/webpack-plugins/nextra.ts
var NextraPlugin = class {
  constructor(config) {
    this.config = config;
  }
  apply(compiler) {
    const pluginName = this.constructor.name;
    compiler.hooks.beforeCompile.tapAsync(pluginName, (_, callback) => __async(this, null, function* () {
      const { locales } = this.config;
      try {
        const result = yield collectFiles({ dir: PAGES_DIR, locales });
        pageMapCache.set(result);
        callback();
      } catch (err) {
        callback(err);
      }
    }));
  }
};

// src/webpack-plugins/nextra-search.ts
var import_webpack = require("next/dist/compiled/webpack/webpack");
var NextraSearchPlugin = class {
  apply(compiler) {
    const pluginName = this.constructor.name;
    compiler.hooks.make.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: import_webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        (assets) => {
          var _a, _b, _c, _d, _e;
          const indexFiles = {};
          for (const entry of compilation.entries.values()) {
            const entryDependency = (_a = entry.dependencies) == null ? void 0 : _a[0];
            let entryModule = compilation.moduleGraph.getResolvedModule(entryDependency);
            if (entryModule && !((_b = entryModule.buildInfo) == null ? void 0 : _b.nextraSearch)) {
              for (const dependency of entryModule.dependencies) {
                const mod = compilation.moduleGraph.getResolvedModule(dependency);
                if ((_c = mod == null ? void 0 : mod.buildInfo) == null ? void 0 : _c.nextraSearch) {
                  entryModule = mod;
                }
              }
            }
            const nextraSearch = (_d = entryModule == null ? void 0 : entryModule.buildInfo) == null ? void 0 : _d.nextraSearch;
            if (nextraSearch) {
              const { title: title2, data, indexKey, route } = nextraSearch;
              const indexFilename = `nextra-data-${indexKey}.json`;
              (_e = indexFiles[indexFilename]) != null ? _e : indexFiles[indexFilename] = {};
              indexFiles[indexFilename][route] = { title: title2, data };
            }
          }
          for (const [file, content] of Object.entries(indexFiles)) {
            assets[`${IS_PRODUCTION ? "../" : ""}../static/chunks/${file}`] = new import_webpack.sources.RawSource(JSON.stringify(content));
          }
        }
      );
    });
  }
};

// src/index.js
var DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];
var nextra = (themeOrNextraConfig, themeConfig) => function withNextra(nextConfig = {}) {
  var _a, _b, _c, _d;
  const nextraConfig = __spreadValues(__spreadValues({}, DEFAULT_CONFIG), typeof themeOrNextraConfig === "string" ? { theme: themeOrNextraConfig, themeConfig } : themeOrNextraConfig);
  if ((_a = nextConfig.i18n) == null ? void 0 : _a.locales) {
    console.log(
      "[nextra] You have Next.js i18n enabled, read here https://nextjs.org/docs/advanced-features/i18n-routing for the docs."
    );
  }
  const locales = ((_b = nextConfig.i18n) == null ? void 0 : _b.locales) || DEFAULT_LOCALES;
  const nextraPlugin = new NextraPlugin(__spreadProps(__spreadValues({}, nextraConfig), { locales }));
  const rewrites = () => __async(this, null, function* () {
    const rules = [
      {
        source: "/:path*/_meta",
        destination: "/404"
      }
    ];
    if (nextConfig.rewrites) {
      const originalRewrites = yield nextConfig.rewrites();
      if (Array.isArray(originalRewrites)) {
        return [...originalRewrites, ...rules];
      }
      return __spreadProps(__spreadValues({}, originalRewrites), {
        beforeFiles: [...originalRewrites.beforeFiles || [], ...rules]
      });
    }
    return rules;
  });
  const nextraLoaderOptions = __spreadProps(__spreadValues({}, nextraConfig), {
    locales,
    defaultLocale: ((_c = nextConfig.i18n) == null ? void 0 : _c.defaultLocale) || DEFAULT_LOCALE,
    pageMapCache,
    newNextLinkBehavior: (_d = nextConfig.experimental) == null ? void 0 : _d.newNextLinkBehavior
  });
  if (!nextraLoaderOptions.theme) {
    throw new Error("No Nextra theme found!");
  }
  return __spreadProps(__spreadValues(__spreadValues({}, nextConfig), nextConfig.output !== "export" && { rewrites }), {
    pageExtensions: [
      ...nextConfig.pageExtensions || DEFAULT_EXTENSIONS,
      ...MARKDOWN_EXTENSIONS
    ],
    webpack(config, options) {
      var _a2;
      if (options.nextRuntime !== "edge" && options.isServer) {
        config.plugins || (config.plugins = []);
        config.plugins.push(nextraPlugin);
        if (nextraConfig.flexsearch) {
          config.plugins.push(new NextraSearchPlugin());
        }
      }
      config.module.rules.push(
        {
          // Match Markdown imports from non-pages. These imports have an
          // issuer, which can be anything as long as it's not empty.
          // When the issuer is null, it means that it can be imported via a
          // runtime import call such as `import('...')`.
          test: MARKDOWN_EXTENSION_REGEX,
          issuer: (request) => !!request || request === null,
          use: [
            options.defaultLoaders.babel,
            {
              loader: "nextra/loader",
              options: nextraLoaderOptions
            }
          ]
        },
        {
          // Match pages (imports without an issuer request).
          test: MARKDOWN_EXTENSION_REGEX,
          issuer: (request) => request === "",
          use: [
            options.defaultLoaders.babel,
            {
              loader: "nextra/loader",
              options: __spreadProps(__spreadValues({}, nextraLoaderOptions), {
                isPageImport: true
              })
            }
          ]
        },
        {
          // Match dynamic meta files inside pages.
          test: /_meta(\.[a-z]{2}-[A-Z]{2})?\.js$/,
          issuer: (request) => !request,
          use: [
            options.defaultLoaders.babel,
            {
              loader: "nextra/loader",
              options: {
                isMetaImport: true
              }
            }
          ]
        }
      );
      return ((_a2 = nextConfig.webpack) == null ? void 0 : _a2.call(nextConfig, config, options)) || config;
    }
  });
};
module.exports = nextra;
