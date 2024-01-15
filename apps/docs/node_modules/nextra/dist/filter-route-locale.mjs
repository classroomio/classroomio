// src/filter-route-locale.ts
import { META_FILENAME } from "./constants.mjs";
import { truthy } from "./utils.mjs";
function filterRouteLocale(pageMap, locale, defaultLocale) {
  const isDefaultLocale = !locale || locale === defaultLocale;
  const filteredPageMap = [];
  const fallbackPages = /* @__PURE__ */ Object.create(null);
  for (const page of pageMap) {
    if (page.kind === "Folder") {
      filteredPageMap.push({
        ...page,
        children: filterRouteLocale(page.children, locale, defaultLocale)
      });
      continue;
    }
    const localDoesMatch = !page.locale && isDefaultLocale || page.locale === locale;
    const name = page.kind === "Meta" ? META_FILENAME : page.name;
    if (localDoesMatch) {
      fallbackPages[name] = null;
      filteredPageMap.push(page);
    } else if (fallbackPages[name] !== null && (!page.locale || page.locale === defaultLocale)) {
      fallbackPages[name] = page;
    }
  }
  return [...filteredPageMap, ...Object.values(fallbackPages).filter(truthy)];
}
export {
  filterRouteLocale as default
};
