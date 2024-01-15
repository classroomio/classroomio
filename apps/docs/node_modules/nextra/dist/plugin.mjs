// src/plugin.ts
import path from "path";
import { promisify } from "util";
import fs from "graceful-fs";
import grayMatter from "gray-matter";
import pLimit from "p-limit";
import {
  CWD,
  DEFAULT_LOCALES,
  DYNAMIC_META_FILENAME,
  MARKDOWN_EXTENSION_REGEX,
  META_FILENAME
} from "./constants.mjs";
import {
  isSerializable,
  normalizePageRoute,
  parseFileName,
  sortPages,
  truthy
} from "./utils.mjs";
var readdir = promisify(fs.readdir);
var readFile = promisify(fs.readFile);
var realpath = promisify(fs.realpath);
var stat = promisify(fs.stat);
var collectMdx = async (filePath, route = "") => {
  const { name, locale } = parseFileName(filePath);
  const content = await readFile(filePath, "utf8");
  const { data } = grayMatter(content);
  return {
    kind: "MdxPage",
    name,
    route,
    ...locale && { locale },
    ...Object.keys(data).length && { frontMatter: data }
  };
};
var limit = pLimit(20);
async function collectFiles({
  dir,
  locales = DEFAULT_LOCALES,
  route = "/",
  fileMap = /* @__PURE__ */ Object.create(null),
  isFollowingSymlink = false
}) {
  var _a;
  const files = await readdir(dir, { withFileTypes: true });
  const promises = files.map(async (f) => {
    const filePath = path.join(dir, f.name);
    let isDirectory = f.isDirectory();
    const isSymlinked = isFollowingSymlink || f.isSymbolicLink();
    let symlinkSource;
    if (isSymlinked) {
      symlinkSource = await realpath(filePath);
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        isDirectory = true;
      }
    }
    const { name, locale, ext } = isDirectory ? (
      // directory couldn't have extensions
      { name: path.basename(filePath), locale: "", ext: "" }
    ) : parseFileName(filePath);
    if (name.startsWith("["))
      return;
    const fileRoute = normalizePageRoute(route, name);
    if (isDirectory) {
      if (fileRoute === "/api")
        return;
      const { items: items2 } = await collectFiles({
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
    return limit(async () => {
      if (MARKDOWN_EXTENSION_REGEX.test(ext)) {
        if (fileRoute === "/_app")
          return;
        const fp = filePath;
        fileMap[fp] = await collectMdx(fp, fileRoute);
        if (symlinkSource) {
          fileMap[symlinkSource] = { ...fileMap[fp] };
        }
        return fileMap[fp];
      }
      const fileName = name + ext;
      try {
        if (fileName === META_FILENAME) {
          const fp = filePath;
          const content = await readFile(fp, "utf8");
          fileMap[fp] = {
            kind: "Meta",
            ...locale && { locale },
            data: JSON.parse(content)
          };
          return fileMap[fp];
        }
        if (fileName === DYNAMIC_META_FILENAME) {
          const importPath = `${filePath}?d=${Date.now()}`;
          const metaMod = await import(importPath);
          const meta = metaMod.default;
          const fp = filePath.replace(/\.js$/, ".json");
          if (typeof meta === "function") {
            fileMap[fp] = {
              kind: "Meta",
              ...locale && { locale },
              __nextra_src: filePath,
              data: {}
            };
          } else if (meta && typeof meta === "object" && isSerializable(meta)) {
            fileMap[fp] = {
              kind: "Meta",
              ...locale && { locale },
              // we spread object because default title could be incorrectly set when _meta.json/js
              // is imported/exported by another _meta.js
              data: { ...meta }
            };
          } else {
            console.error(
              `[nextra] "${fileName}" is not a valid meta file. The default export is required to be a serializable object or a function. Please check the following file:`,
              path.relative(CWD, filePath)
            );
          }
          return fileMap[fp];
        }
      } catch (err) {
        const relPath = path.relative(CWD, filePath);
        console.error(
          `[nextra] Error loading ${relPath}
${err.name}: ${err.message}`
        );
      }
      if (fileName === "meta.json") {
        console.warn(
          '[nextra] "meta.json" was renamed to "_meta.json". Rename the following file:',
          path.relative(CWD, filePath)
        );
      } else if (/_meta\.(jsx|ts|tsx|cjs|mjs)$/.test(fileName)) {
        console.error(
          `[nextra] "${fileName}" is not currently supported, please rename the following file to "${DYNAMIC_META_FILENAME}":`,
          path.relative(CWD, filePath)
        );
      }
    });
  });
  const items = (await Promise.all(promises)).filter(truthy);
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
    const metaPath = path.join(dir, metaFilename);
    if (metaIndex === void 0 && defaultMeta.length > 0) {
      const meta = {
        kind: "Meta",
        ...locale && { locale },
        data: Object.fromEntries(defaultMeta)
      };
      fileMap[metaPath] = meta;
      items.push(meta);
      metaIndex = items.length - 1;
    }
    if (metaIndex !== void 0) {
      const meta = { ...items[metaIndex] };
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
}
export {
  collectFiles,
  collectMdx
};
