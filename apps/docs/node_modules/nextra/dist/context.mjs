// src/context.ts
import { NEXTRA_INTERNAL } from "./constants.mjs";
import { normalizeMeta } from "./utils.mjs";
function getContext(name) {
  const __nextra_internal__ = globalThis[NEXTRA_INTERNAL];
  if (!__nextra_internal__) {
    throw new Error(
      `Nextra context not found. Please make sure you are using "${name}" of "nextra/context" on a Nextra page.`
    );
  }
  return {
    pageMap: __nextra_internal__.pageMap,
    route: __nextra_internal__.route
  };
}
function filter(pageMap, activeLevel) {
  let activeLevelPages = [];
  const items = [];
  const meta = pageMap.find(
    (item) => item.kind === "Meta"
  );
  const metaData = meta?.data || {};
  for (const item of pageMap) {
    if (item.kind === "Meta")
      continue;
    const meta2 = normalizeMeta(metaData[item.name]);
    const page = {
      ...item,
      ...Object.keys(meta2 || {}).length > 0 && { meta: meta2 }
    };
    if (page.kind === "Folder") {
      const filtered = filter(page.children, activeLevel);
      page.children = filtered.items;
      if (filtered.activeLevelPages.length) {
        activeLevelPages = filtered.activeLevelPages;
      } else if (page.route === activeLevel) {
        if (!activeLevelPages.length) {
          activeLevelPages = page.children;
        }
      }
    }
    items.push(page);
  }
  const metaKeys = Object.keys(metaData);
  items.sort((a, b) => {
    const indexA = metaKeys.indexOf(a.name);
    const indexB = metaKeys.indexOf(b.name);
    if (indexA === -1 && indexB === -1)
      return a.name < b.name ? -1 : 1;
    if (indexA === -1)
      return 1;
    if (indexB === -1)
      return -1;
    return indexA - indexB;
  });
  return { items, activeLevelPages };
}
function getAllPages() {
  const { pageMap } = getContext("getAllPages");
  return filter(pageMap).items;
}
function getCurrentLevelPages() {
  const { pageMap, route } = getContext("getCurrentLevelPages");
  return filter(pageMap, route).activeLevelPages;
}
function getPagesUnderRoute(route) {
  const { pageMap } = getContext("getPagesUnderRoute");
  return filter(pageMap, route).activeLevelPages;
}
export {
  getAllPages,
  getCurrentLevelPages,
  getPagesUnderRoute
};
