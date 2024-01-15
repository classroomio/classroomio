// src/loader.ts
import path from "path";
import fs from "graceful-fs";
import slash from "slash";
import { compileMdx } from "./compile.mjs";
import {
  CWD,
  IS_PRODUCTION,
  MARKDOWN_EXTENSION_REGEX,
  OFFICIAL_THEMES
} from "./constants.mjs";
import { existsSync, PAGES_DIR } from "./file-system.mjs";
import { resolvePageMap } from "./page-map.mjs";
import { collectFiles, collectMdx } from "./plugin.mjs";
import { hashFnv32a, pageTitleFromFilename, parseFileName } from "./utils.mjs";
var IS_WEB_CONTAINER = !!process.versions.webcontainer;
var APP_MDX_PATH = path.join(PAGES_DIR, "_app.mdx");
var UNDERSCORE_APP_FILENAME = fs.readdirSync(PAGES_DIR).find((fileName) => /^_app\.(js|jsx|ts|tsx|md)$/.test(fileName)) || "";
var HAS_UNDERSCORE_APP_MDX_FILE = existsSync(APP_MDX_PATH);
var FOOTER_TO_REMOVE = "export default MDXContent;";
if (UNDERSCORE_APP_FILENAME) {
  console.warn(
    `[nextra] Found "${UNDERSCORE_APP_FILENAME}" file, refactor it to "_app.mdx" for better performance.`
  );
}
var initGitRepo = (async () => {
  if (!IS_WEB_CONTAINER) {
    const { Repository } = await import("@napi-rs/simple-git");
    try {
      const repository = Repository.discover(CWD);
      if (repository.isShallow()) {
        if (process.env.VERCEL) {
          console.warn(
            "[nextra] The repository is shallow cloned, so the latest modified time will not be presented. Set the VERCEL_DEEP_CLONE=true environment variable to enable deep cloning."
          );
        } else if (process.env.GITHUB_ACTION) {
          console.warn(
            "[nextra] The repository is shallow cloned, so the latest modified time will not be presented. See https://github.com/actions/checkout#fetch-all-history-for-all-tags-and-branches to fetch all the history."
          );
        } else {
          console.warn(
            "[nextra] The repository is shallow cloned, so the latest modified time will not be presented."
          );
        }
      }
      const gitRoot = path.join(repository.path(), "..");
      return { repository, gitRoot };
    } catch (error) {
      console.warn(
        `[nextra] Init git repository failed ${error.message}`
      );
    }
  }
  return {};
})();
async function loader(context, source) {
  const {
    isMetaImport = false,
    isPageImport = false,
    theme,
    themeConfig,
    locales,
    defaultLocale,
    defaultShowCopyCode,
    flexsearch,
    latex,
    staticImage,
    readingTime: _readingTime,
    mdxOptions,
    pageMapCache,
    newNextLinkBehavior,
    transform,
    transformPageOpts,
    codeHighlight
  } = context.getOptions();
  context.cacheable(true);
  if (isMetaImport) {
    return "export default () => null";
  }
  const mdxPath = context._module?.resourceResolveData ? (
    // to make it work with symlinks, resolve the mdx path based on the relative path
    /*
     * `context.rootContext` could include path chunk of
     * `context._module.resourceResolveData.relativePath` use
     * `context._module.resourceResolveData.descriptionFileRoot` instead
     */
    path.join(
      context._module.resourceResolveData.descriptionFileRoot,
      context._module.resourceResolveData.relativePath
    )
  ) : context.resourcePath;
  if (mdxPath.includes("/pages/api/")) {
    console.warn(
      `[nextra] Ignoring ${mdxPath} because it is located in the "pages/api" folder.`
    );
    return "";
  }
  const { items, fileMap } = IS_PRODUCTION ? pageMapCache.get() : await collectFiles({ dir: PAGES_DIR, locales });
  if (!fileMap[mdxPath]) {
    fileMap[mdxPath] = await collectMdx(mdxPath);
    if (!IS_PRODUCTION) {
      context.addMissingDependency(mdxPath);
    }
  }
  const { locale } = parseFileName(mdxPath);
  const isLocalTheme = theme.startsWith(".") || theme.startsWith("/");
  const pageNextRoute = "/" + slash(path.relative(PAGES_DIR, mdxPath)).replace(MARKDOWN_EXTENSION_REGEX, "").replace(/\/index$/, "").replace(/^index$/, "");
  if (!IS_PRODUCTION) {
    for (const [filePath, file] of Object.entries(fileMap)) {
      if (file.kind === "Meta" && (!locale || file.locale === locale)) {
        context.addDependency(filePath);
      }
    }
    context.addContextDependency(PAGES_DIR);
    if (isLocalTheme) {
      context.addDependency(path.resolve(theme));
    }
    if (themeConfig) {
      context.addDependency(path.resolve(themeConfig));
    }
  }
  const {
    result,
    title,
    frontMatter,
    structurizedData,
    searchIndexKey,
    hasJsxInH1,
    readingTime
  } = await compileMdx(source, {
    mdxOptions: {
      ...mdxOptions,
      jsx: true,
      outputFormat: "program",
      format: "detect"
    },
    readingTime: _readingTime,
    defaultShowCopyCode,
    staticImage,
    flexsearch,
    latex,
    codeHighlight,
    route: pageNextRoute,
    locale,
    filePath: mdxPath,
    useCachedCompiler: true,
    isPageImport
  });
  if (!isPageImport) {
    return result;
  }
  const { route, pageMap, dynamicMetaItems } = resolvePageMap({
    filePath: mdxPath,
    fileMap,
    defaultLocale,
    items
  });
  const fallbackTitle = frontMatter.title || title || pageTitleFromFilename(fileMap[mdxPath].name);
  if (searchIndexKey && frontMatter.searchable !== false) {
    const { buildInfo } = context._module;
    buildInfo.nextraSearch = {
      indexKey: searchIndexKey,
      title: fallbackTitle,
      data: structurizedData,
      route: pageNextRoute
    };
  }
  let timestamp;
  const { repository, gitRoot } = await initGitRepo;
  if (repository && gitRoot) {
    try {
      timestamp = await repository.getFileLatestModifiedDateAsync(
        path.relative(gitRoot, mdxPath)
      );
    } catch {
    }
  }
  const layout = isLocalTheme ? slash(path.resolve(theme)) : theme;
  let pageOpts = {
    filePath: slash(path.relative(CWD, mdxPath)),
    route,
    ...Object.keys(frontMatter).length > 0 && { frontMatter },
    hasJsxInH1,
    timestamp,
    pageMap,
    ...!HAS_UNDERSCORE_APP_MDX_FILE && {
      flexsearch,
      newNextLinkBehavior
      // todo: remove in v3
    },
    readingTime,
    title: fallbackTitle
  };
  if (transformPageOpts) {
    pageOpts = transformPageOpts(pageOpts);
  }
  const themeConfigImport = themeConfig ? `import __nextra_themeConfig from '${slash(path.resolve(themeConfig))}'` : "";
  const katexCssImport = latex ? "import 'katex/dist/katex.min.css'" : "";
  const cssImport = OFFICIAL_THEMES.includes(theme) ? `import '${theme}/style.css'` : "";
  const finalResult = transform ? await transform(result, { route }) : result;
  const pageImports = `import __nextra_layout from '${layout}'
${themeConfigImport}
${katexCssImport}
${cssImport}`;
  if (pageNextRoute === "/_app") {
    return `${pageImports}
${finalResult}

const __nextra_internal__ = globalThis[Symbol.for('__nextra_internal__')] ||= Object.create(null)
__nextra_internal__.Layout = __nextra_layout
__nextra_internal__.pageMap = ${JSON.stringify(pageOpts.pageMap)}
__nextra_internal__.flexsearch = ${JSON.stringify(flexsearch)}
${themeConfigImport ? "__nextra_internal__.themeConfig = __nextra_themeConfig" : ""}`;
  }
  if (HAS_UNDERSCORE_APP_MDX_FILE) {
    delete pageOpts.pageMap;
  }
  const stringifiedPageOpts = JSON.stringify(pageOpts).slice(0, -1) + `,headings:__toc}`;
  const stringifiedChecksum = IS_PRODUCTION ? "''" : JSON.stringify(hashFnv32a(stringifiedPageOpts));
  const dynamicMetaModules = dynamicMetaItems.map(
    (descriptor) => `[import(${JSON.stringify(descriptor.metaFilePath)}), ${JSON.stringify(
      descriptor
    )}]`
  ).join(",");
  const lastIndexOfFooter = finalResult.lastIndexOf(FOOTER_TO_REMOVE);
  const rawJs = `import { setupNextraPage } from 'nextra/setup-page'
${HAS_UNDERSCORE_APP_MDX_FILE ? "" : pageImports}
${// Remove the last match of `export default MDXContent;` because it can be existed in the raw MDX file
  finalResult.slice(0, lastIndexOfFooter) + finalResult.slice(lastIndexOfFooter + FOOTER_TO_REMOVE.length)}

const __nextraPageOptions = {
  MDXContent,
  pageOpts: ${stringifiedPageOpts},
  pageNextRoute: ${JSON.stringify(pageNextRoute)},
  ${HAS_UNDERSCORE_APP_MDX_FILE ? "" : "nextraLayout: __nextra_layout," + (themeConfigImport && "themeConfig: __nextra_themeConfig")}
}
if (process.env.NODE_ENV !== 'production') {
  __nextraPageOptions.hot = module.hot
  __nextraPageOptions.pageOptsChecksum = ${stringifiedChecksum}
}
if (typeof window === 'undefined') __nextraPageOptions.dynamicMetaModules = [${dynamicMetaModules}]

export default setupNextraPage(__nextraPageOptions)`;
  return rawJs;
}
function syncLoader(source, callback) {
  loader(this, source).then((result) => callback(null, result)).catch((err) => callback(err));
}
export {
  syncLoader as default
};
