// src/setup-page.ts
import get from "lodash.get";
import { NEXTRA_INTERNAL } from "./constants.mjs";
import NextraLayout from "./layout";
import { normalizePageRoute, pageTitleFromFilename } from "./utils.mjs";
function isFolder(value) {
  return !!value && typeof value === "object" && value.type === "folder";
}
function normalizeMetaData(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (isFolder(value)) {
        const keyWithoutSlash = key.replace("/", "");
        return [
          keyWithoutSlash,
          value.title || pageTitleFromFilename(keyWithoutSlash)
        ];
      }
      return [key, value || pageTitleFromFilename(key)];
    })
  );
}
function collectCatchAllRoutes(parent, meta, isRootFolder = true) {
  if (isRootFolder) {
    collectCatchAllRoutes(
      parent,
      {
        kind: "Meta",
        data: meta.data,
        locale: meta.locale
      },
      false
    );
    meta.data = normalizeMetaData(meta.data);
    return;
  }
  for (const [key, value] of Object.entries(meta.data)) {
    if (!isFolder(value)) {
      if (key === "*") {
        continue;
      }
      parent.children.push({
        kind: "MdxPage",
        ...meta.locale && { locale: meta.locale },
        name: key,
        route: normalizePageRoute(parent.route, key)
      });
      continue;
    }
    const routeWithoutSlashes = key.replace("/", "");
    const newParent = {
      kind: "Folder",
      name: routeWithoutSlashes,
      route: `${parent.route}/${routeWithoutSlashes}`,
      children: [
        {
          kind: "Meta",
          ...meta.locale && { locale: meta.locale },
          data: normalizeMetaData(value.items)
        }
      ]
    };
    parent.children.push(newParent);
    collectCatchAllRoutes(
      newParent,
      {
        kind: "Meta",
        data: value.items,
        locale: meta.locale
      },
      false
    );
  }
}
var cachedResolvedPageMap;
function setupNextraPage({
  pageNextRoute,
  pageOpts,
  nextraLayout,
  themeConfig,
  MDXContent,
  hot,
  pageOptsChecksum,
  dynamicMetaModules = []
}) {
  var _a;
  if (typeof window === "undefined") {
    globalThis.__nextra_resolvePageMap = async () => {
      if (process.env.NODE_ENV === "production" && cachedResolvedPageMap) {
        return cachedResolvedPageMap;
      }
      const clonedPageMap = JSON.parse(
        JSON.stringify(__nextra_internal__.pageMap)
      );
      await Promise.all(
        dynamicMetaModules.map(
          async ([importMod, { metaObjectKeyPath, metaParentKeyPath }]) => {
            const mod = await importMod;
            const metaData = await mod.default();
            const meta = get(
              clonedPageMap,
              metaObjectKeyPath
            );
            meta.data = metaData;
            const parent = get(clonedPageMap, metaParentKeyPath);
            collectCatchAllRoutes(parent, meta);
          }
        )
      );
      return cachedResolvedPageMap = clonedPageMap;
    };
  }
  const __nextra_internal__ = globalThis[_a = NEXTRA_INTERNAL] || (globalThis[_a] = /* @__PURE__ */ Object.create(null));
  if (pageOpts.pageMap) {
    __nextra_internal__.pageMap = pageOpts.pageMap;
    __nextra_internal__.Layout = nextraLayout;
  } else {
    pageOpts = {
      ...pageOpts,
      pageMap: __nextra_internal__.pageMap,
      flexsearch: __nextra_internal__.flexsearch
    };
    themeConfig = __nextra_internal__.themeConfig;
  }
  pageOpts = {
    // @ts-ignore ignore "'frontMatter' is specified more than once" error to treeshake empty object `{}` for each compiled page
    frontMatter: {},
    ...pageOpts
  };
  __nextra_internal__.route = pageOpts.route;
  __nextra_internal__.context || (__nextra_internal__.context = /* @__PURE__ */ Object.create(null));
  __nextra_internal__.context[pageNextRoute] = {
    Content: MDXContent,
    pageOpts,
    themeConfig
  };
  if (process.env.NODE_ENV !== "production" && hot) {
    __nextra_internal__.refreshListeners || (__nextra_internal__.refreshListeners = /* @__PURE__ */ Object.create(null));
    const checksum = pageOptsChecksum;
    hot.data || (hot.data = /* @__PURE__ */ Object.create(null));
    if (hot.data.prevPageOptsChecksum !== checksum) {
      const listeners = __nextra_internal__.refreshListeners[pageNextRoute] || [];
      for (const listener of listeners) {
        listener();
      }
    }
    hot.dispose((data) => {
      data.prevPageOptsChecksum = checksum;
    });
  }
  return NextraLayout;
}
export {
  collectCatchAllRoutes,
  setupNextraPage
};
