// src/page-map.ts
import { IS_PRODUCTION } from "./constants.mjs";
import filterRouteLocale from "./filter-route-locale.mjs";
function getDynamicMeta(path, items, locale) {
  const newItems = [];
  const dynamicMetaItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "Folder") {
      const [dynamicItemsInChildren, newItemsInChildren] = getDynamicMeta(
        `${path}[${i}].children`,
        item.children,
        locale
      );
      dynamicMetaItems.push(...dynamicItemsInChildren);
      if (newItemsInChildren.length) {
        newItems.push({
          ...item,
          children: newItemsInChildren
        });
      }
      continue;
    }
    if (item.kind === "Meta" && item.__nextra_src) {
      if (locale === item.locale) {
        const { __nextra_src, ...newItem } = item;
        dynamicMetaItems.push({
          metaFilePath: __nextra_src,
          metaObjectKeyPath: `${path}[${i}]`,
          metaParentKeyPath: path.replace(/\.children$/, "")
        });
        newItems.push(newItem);
      }
      continue;
    }
    newItems.push(item);
  }
  return [dynamicMetaItems, newItems];
}
var cachedDynamicMetaForLocale = /* @__PURE__ */ Object.create(null);
function resolvePageMap({
  filePath,
  items,
  fileMap,
  defaultLocale
}) {
  const { locale, route } = fileMap[filePath];
  const localeKey = locale || "";
  const [dynamicMetaItems, newItems] = IS_PRODUCTION && cachedDynamicMetaForLocale[localeKey] || (cachedDynamicMetaForLocale[localeKey] = getDynamicMeta(
    "",
    locale ? filterRouteLocale(items, locale, defaultLocale) : items,
    locale
  ));
  return {
    pageMap: newItems,
    route,
    dynamicMetaItems
  };
}
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
export {
  PageMapCache,
  getDynamicMeta,
  pageMapCache,
  resolvePageMap
};
