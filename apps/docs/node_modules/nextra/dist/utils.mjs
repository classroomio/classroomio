// src/utils.ts
import path from "path";
import slash from "slash";
import title from "title";
import { LOCALE_REGEX } from "./constants.mjs";
function parseFileName(filePath) {
  const { name, ext } = path.parse(filePath);
  const locale = name.match(LOCALE_REGEX)?.[1] || "";
  return {
    name: locale ? name.replace(LOCALE_REGEX, "") : name,
    locale,
    ext
  };
}
function truthy(value) {
  return !!value;
}
function normalizeMeta(meta) {
  return typeof meta === "string" ? { title: meta } : meta;
}
function normalizePageRoute(parentRoute, route) {
  return slash(path.join(parentRoute, route.replace(/^index$/, "")));
}
function pageTitleFromFilename(fileName) {
  return title(fileName.replaceAll(/[-_]/g, " "));
}
function sortPages(pages, locale) {
  if (locale === "") {
    locale = void 0;
  }
  return pages.filter((item) => item.kind === "Folder" || item.locale === locale).map((item) => ({
    name: item.name,
    date: "frontMatter" in item && item.frontMatter?.date,
    title: "frontMatter" in item && item.frontMatter?.title || pageTitleFromFilename(item.name)
  })).sort((a, b) => {
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
function hashFnv32a(str, seed = 2166136261) {
  let hval = seed;
  for (let i = 0; i < str.length; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return ("0000000" + (hval >>> 0).toString(16)).substring(-8);
}
function getDefault(module) {
  return module.default || module;
}
export {
  getDefault,
  hashFnv32a,
  isSerializable,
  normalizeMeta,
  normalizePageRoute,
  pageTitleFromFilename,
  parseFileName,
  sortPages,
  truthy
};
