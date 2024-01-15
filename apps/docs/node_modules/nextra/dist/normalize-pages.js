// src/normalize-pages.ts
import { z } from "zod";
import { ERROR_ROUTES } from "./constants.mjs";
var DEFAULT_PAGE_THEME = {
  breadcrumb: true,
  collapsed: false,
  footer: true,
  layout: "default",
  navbar: true,
  pagination: true,
  sidebar: true,
  timestamp: true,
  toc: true,
  typesetting: "default"
};
var pageThemeSchema = z.strictObject({
  breadcrumb: z.boolean(),
  collapsed: z.boolean(),
  footer: z.boolean(),
  layout: z.enum(["default", "full", "raw"]),
  navbar: z.boolean(),
  pagination: z.boolean(),
  sidebar: z.boolean(),
  timestamp: z.boolean(),
  toc: z.boolean(),
  typesetting: z.enum(["default", "article"])
});
var displaySchema = z.enum(["normal", "hidden", "children"]);
var titleSchema = z.string();
var linkItemSchema = z.strictObject({
  href: z.string(),
  newWindow: z.boolean(),
  title: titleSchema
});
var menuItemSchema = z.strictObject({
  display: displaySchema.optional(),
  items: z.record(linkItemSchema.partial({ href: true, newWindow: true })),
  title: titleSchema,
  type: z.literal("menu")
});
var separatorItemSchema = z.strictObject({
  title: titleSchema,
  type: z.literal("separator")
});
var itemSchema = linkItemSchema.extend({
  display: displaySchema,
  theme: pageThemeSchema,
  title: titleSchema,
  type: z.enum(["page", "doc"])
}).deepPartial();
var metaSchema = z.string().or(menuItemSchema).or(separatorItemSchema).or(itemSchema);
function extendMeta(meta = {}, fallback) {
  if (typeof meta === "string") {
    meta = { title: meta };
  }
  const theme = Object.assign({}, fallback.theme, meta.theme);
  return Object.assign({}, fallback, meta, { theme });
}
function findFirstRoute(items) {
  for (const item of items) {
    if (item.route)
      return item.route;
    if (item.children) {
      const route = findFirstRoute(item.children);
      if (route)
        return route;
    }
  }
}
function normalizePages({
  list,
  locale,
  defaultLocale,
  route,
  docsRoot = "",
  underCurrentDocsRoot = false,
  pageThemeContext = DEFAULT_PAGE_THEME
}) {
  let _meta;
  for (const item of list) {
    if (item.kind === "Meta") {
      if (item.locale === locale) {
        _meta = item.data;
        break;
      }
      _meta || (_meta = item.data);
    }
  }
  const meta = _meta || {};
  const metaKeys = Object.keys(meta);
  for (const key of metaKeys) {
    if (typeof meta[key] === "string") {
      meta[key] = {
        title: meta[key]
      };
    }
  }
  const directories = [];
  const flatDirectories = [];
  const docsDirectories = [];
  const flatDocsDirectories = [];
  const topLevelNavbarItems = [];
  let activeType;
  let activeIndex = 0;
  let activeThemeContext = pageThemeContext;
  let activePath = [];
  let metaKeyIndex = -1;
  const fallbackMeta = meta["*"] || {};
  delete fallbackMeta.title;
  delete fallbackMeta.href;
  const items = list.filter(
    (a) => (
      // not meta
      a.kind !== "Meta" && // not hidden routes
      !a.name.startsWith("_") && // locale matches, or fallback to default locale
      (!("locale" in a) || !a.locale || [locale, defaultLocale].includes(a.locale))
    )
  ).sort((a, b) => {
    const indexA = metaKeys.indexOf(a.name);
    const indexB = metaKeys.indexOf(b.name);
    if (indexA === -1 && indexB === -1)
      return a.name < b.name ? -1 : 1;
    if (indexA === -1)
      return 1;
    if (indexB === -1)
      return -1;
    return indexA - indexB;
  }).flatMap((item) => {
    const items2 = [];
    const index = metaKeys.indexOf(item.name);
    let extendedItem;
    if (index !== -1) {
      for (let i = metaKeyIndex + 1; i < index; i++) {
        const key = metaKeys[i];
        if (key !== "*") {
          items2.push({
            name: key,
            route: "",
            ...meta[key]
          });
        }
      }
      metaKeyIndex = index;
      extendedItem = { ...meta[item.name], ...item };
    }
    items2.push(extendedItem || item);
    return items2;
  });
  for (let i = metaKeyIndex + 1; i < metaKeys.length; i++) {
    const key = metaKeys[i];
    if (key !== "*") {
      items.push({
        name: key,
        route: "#",
        ...meta[key]
      });
    }
  }
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (i + 1 < items.length && a.name === items[i + 1].name) {
      items[i + 1] = { ...items[i + 1], withIndexPage: true };
      if (a.children && !items[i + 1].children) {
        items[i + 1].children = a.children;
      }
      continue;
    }
    const extendedMeta = extendMeta(meta[a.name], fallbackMeta);
    const { display, type = "doc" } = extendedMeta;
    const extendedPageThemeContext = {
      ...pageThemeContext,
      ...extendedMeta.theme
    };
    const isCurrentDocsTree = route.startsWith(docsRoot);
    const normalizedChildren = a.children && normalizePages({
      list: a.children,
      locale,
      defaultLocale,
      route,
      docsRoot: type === "page" || type === "menu" ? a.route : docsRoot,
      underCurrentDocsRoot: underCurrentDocsRoot || isCurrentDocsTree,
      pageThemeContext: extendedPageThemeContext
    });
    const title = extendedMeta.title || type !== "separator" && a.name;
    const getItem = () => ({
      ...a,
      type,
      ...title && { title },
      ...display && { display },
      ...normalizedChildren && { children: [] }
    });
    const item = getItem();
    const docsItem = getItem();
    const pageItem = getItem();
    docsItem.isUnderCurrentDocsTree = isCurrentDocsTree;
    if (type === "separator") {
      item.isUnderCurrentDocsTree = isCurrentDocsTree;
    }
    if (a.route === route) {
      activePath = [item];
      activeType = type;
      activeThemeContext = {
        ...activeThemeContext,
        ...extendedPageThemeContext
      };
      switch (type) {
        case "page":
        case "menu":
          activeIndex = topLevelNavbarItems.length;
          break;
        case "doc":
          activeIndex = flatDocsDirectories.length;
      }
    }
    if (display === "hidden" && item.kind !== "Folder" || ERROR_ROUTES.has(a.route)) {
      continue;
    }
    if (normalizedChildren) {
      if (normalizedChildren.activeIndex !== void 0 && normalizedChildren.activeType !== void 0) {
        activeThemeContext = normalizedChildren.activeThemeContext;
        activeType = normalizedChildren.activeType;
        activePath = [item, ...normalizedChildren.activePath];
        switch (activeType) {
          case "page":
          case "menu":
            activeIndex = topLevelNavbarItems.length + normalizedChildren.activeIndex;
            break;
          case "doc":
            activeIndex = flatDocsDirectories.length + normalizedChildren.activeIndex;
            break;
        }
        if (a.withIndexPage && type === "doc") {
          activeIndex++;
        }
      }
      switch (type) {
        case "page":
        case "menu":
          pageItem.children.push(...normalizedChildren.directories);
          docsDirectories.push(...normalizedChildren.docsDirectories);
          if (normalizedChildren.flatDirectories.length) {
            pageItem.firstChildRoute = findFirstRoute(
              normalizedChildren.flatDirectories
            );
            topLevelNavbarItems.push(pageItem);
          } else if (pageItem.withIndexPage) {
            topLevelNavbarItems.push(pageItem);
          }
          break;
        case "doc":
          if (Array.isArray(docsItem.children)) {
            docsItem.children.push(...normalizedChildren.docsDirectories);
          }
          if (item.withIndexPage && display !== "children") {
            flatDocsDirectories.push(docsItem);
          }
      }
      flatDirectories.push(...normalizedChildren.flatDirectories);
      flatDocsDirectories.push(...normalizedChildren.flatDocsDirectories);
      if (Array.isArray(item.children)) {
        item.children.push(...normalizedChildren.directories);
      }
    } else {
      flatDirectories.push(item);
      switch (type) {
        case "page":
        case "menu":
          topLevelNavbarItems.push(pageItem);
          break;
        case "doc":
          flatDocsDirectories.push(docsItem);
      }
    }
    if (type === "doc" && display === "children") {
      if (docsItem.children) {
        directories.push(...docsItem.children);
        docsDirectories.push(...docsItem.children);
      }
    } else {
      directories.push(item);
    }
    switch (type) {
      case "page":
      case "menu":
        docsDirectories.push(pageItem);
        break;
      case "doc":
        if (display !== "children") {
          docsDirectories.push(docsItem);
        }
        break;
      case "separator":
        docsDirectories.push(item);
    }
  }
  return {
    activeType,
    activeIndex,
    activeThemeContext,
    activePath,
    directories,
    flatDirectories,
    docsDirectories,
    flatDocsDirectories,
    topLevelNavbarItems
  };
}
export {
  metaSchema,
  normalizePages
};
