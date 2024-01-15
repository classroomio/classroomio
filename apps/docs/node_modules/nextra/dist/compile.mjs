// src/compile.ts
import { createRequire } from "module";
import path from "path";
import { createProcessor } from "@mdx-js/mdx";
import { remarkMermaid } from "@theguild/remark-mermaid";
import { remarkNpm2Yarn } from "@theguild/remark-npm2yarn";
import grayMatter from "gray-matter";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkReadingTime from "remark-reading-time";
import {
  CODE_BLOCK_FILENAME_REGEX,
  CWD,
  DEFAULT_LOCALE,
  ERROR_ROUTES,
  MARKDOWN_URL_EXTENSION_REGEX
} from "./constants.mjs";
import {
  attachMeta,
  parseMeta,
  remarkCustomHeadingId,
  remarkHeadings,
  remarkLinkRewrite,
  remarkMdxDisableExplicitJsx,
  remarkRemoveImports,
  remarkReplaceImports,
  remarkStaticImage,
  remarkStructurize
} from "./mdx-plugins/index.mjs";

// src/theme.json
var theme_default = {
  name: "css-variables",
  type: "css",
  colors: {
    "editor.foreground": "#000001",
    "editor.background": "#000002",
    "terminal.ansiBlack": "#A00000",
    "terminal.ansiRed": "#A00001",
    "terminal.ansiGreen": "#A00002",
    "terminal.ansiYellow": "#A00003",
    "terminal.ansiBlue": "#A00004",
    "terminal.ansiMagenta": "#A00005",
    "terminal.ansiCyan": "#A00006",
    "terminal.ansiWhite": "#A00007",
    "terminal.ansiBrightBlack": "#A00008",
    "terminal.ansiBrightRed": "#A00009",
    "terminal.ansiBrightGreen": "#A00010",
    "terminal.ansiBrightYellow": "#A00011",
    "terminal.ansiBrightBlue": "#A00012",
    "terminal.ansiBrightMagenta": "#A00013",
    "terminal.ansiBrightCyan": "#A00014",
    "terminal.ansiBrightWhite": "#A00015"
  },
  tokenColors: [
    {
      settings: {
        foreground: "#000001"
      }
    },
    {
      scope: [
        "markup.deleted",
        "meta.diff.header.from-file",
        "punctuation.definition.deleted"
      ],
      settings: {
        foreground: "#ef6270"
      }
    },
    {
      scope: [
        "markup.inserted",
        "meta.diff.header.to-file",
        "punctuation.definition.inserted"
      ],
      settings: {
        foreground: "#4bb74a"
      }
    },
    {
      scope: [
        "keyword.operator.accessor",
        "meta.group.braces.round.function.arguments",
        "meta.template.expression",
        "markup.fenced_code meta.embedded.block"
      ],
      settings: {
        foreground: "#000001"
      }
    },
    {
      scope: "emphasis",
      settings: {
        fontStyle: "italic"
      }
    },
    {
      scope: ["strong", "markup.heading.markdown", "markup.bold.markdown"],
      settings: {
        fontStyle: "bold"
      }
    },
    {
      scope: ["markup.italic.markdown"],
      settings: {
        fontStyle: "italic"
      }
    },
    {
      scope: "meta.link.inline.markdown",
      settings: {
        fontStyle: "underline",
        foreground: "#000004"
      }
    },
    {
      scope: ["string", "markup.fenced_code", "markup.inline"],
      settings: {
        foreground: "#000005"
      }
    },
    {
      scope: ["comment", "string.quoted.docstring.multi"],
      settings: {
        foreground: "#000006"
      }
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.other.placeholder",
        "constant.character.format.placeholder",
        "variable.language.this",
        "variable.other.object",
        "variable.other.class",
        "variable.other.constant",
        "meta.property-name",
        "meta.property-value",
        "support"
      ],
      settings: {
        foreground: "#000004"
      }
    },
    {
      scope: [
        "keyword",
        "storage.modifier",
        "storage.type",
        "storage.control.clojure",
        "entity.name.function.clojure",
        "entity.name.tag.yaml",
        "support.function.node",
        "support.type.property-name.json",
        "punctuation.separator.key-value",
        "punctuation.definition.template-expression"
      ],
      settings: {
        foreground: "#000007"
      }
    },
    {
      scope: "variable.parameter.function",
      settings: {
        foreground: "#000008"
      }
    },
    {
      scope: [
        "support.function",
        "entity.name.type",
        "entity.other.inherited-class",
        "meta.function-call",
        "meta.instance.constructor",
        "entity.other.attribute-name",
        "entity.name.function",
        "constant.keyword.clojure"
      ],
      settings: {
        foreground: "#000009"
      }
    },
    {
      scope: [
        "entity.name.tag",
        "string.quoted",
        "string.regexp",
        "string.interpolated",
        "string.template",
        "string.unquoted.plain.out.yaml",
        "keyword.other.template"
      ],
      settings: {
        foreground: "#000010"
      }
    },
    {
      scope: [
        "punctuation.definition.arguments",
        "punctuation.definition.dict",
        "punctuation.separator",
        "meta.function-call.arguments"
      ],
      settings: {
        foreground: "#000011"
      }
    },
    {
      name: "[Custom] Markdown links",
      scope: [
        "markup.underline.link",
        "punctuation.definition.metadata.markdown"
      ],
      settings: {
        foreground: "#000012"
      }
    },
    {
      name: "[Custom] Markdown list",
      scope: ["beginning.punctuation.definition.list.markdown"],
      settings: {
        foreground: "#000005"
      }
    },
    {
      name: "[Custom] Markdown punctuation definition brackets",
      scope: [
        "punctuation.definition.string.begin.markdown",
        "punctuation.definition.string.end.markdown",
        "string.other.link.title.markdown",
        "string.other.link.description.markdown"
      ],
      settings: {
        foreground: "#000007"
      }
    }
  ]
};

// src/compile.ts
import { truthy } from "./utils.mjs";
globalThis.__nextra_temp_do_not_use = () => {
  import("./__temp__");
};
var require2 = createRequire(import.meta.url);
var DEFAULT_REHYPE_PRETTY_CODE_OPTIONS = {
  // @ts-expect-error -- TODO: fix type error
  theme: theme_default,
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className.push("highlighted");
  },
  onVisitHighlightedWord(node) {
    node.properties.className = ["highlighted"];
  },
  filterMetaString: (meta) => meta.replace(CODE_BLOCK_FILENAME_REGEX, "")
};
var cachedCompilerForFormat = /* @__PURE__ */ Object.create(null);
var clonedRemarkLinkRewrite = remarkLinkRewrite.bind(null);
async function compileMdx(source, {
  staticImage,
  flexsearch,
  readingTime,
  latex,
  codeHighlight,
  defaultShowCopyCode,
  route = "",
  locale,
  mdxOptions,
  filePath = "",
  useCachedCompiler,
  isPageImport = true
} = {}) {
  const { data: frontMatter, content } = grayMatter(source);
  let searchIndexKey = null;
  if (ERROR_ROUTES.has(route) || route === "/_app") {
  } else if (typeof flexsearch === "object") {
    if (flexsearch.indexKey) {
      searchIndexKey = flexsearch.indexKey(filePath, route, locale);
      if (searchIndexKey === "") {
        searchIndexKey = locale || DEFAULT_LOCALE;
      }
    } else {
      searchIndexKey = locale || DEFAULT_LOCALE;
    }
  } else if (flexsearch) {
    searchIndexKey = locale || DEFAULT_LOCALE;
  }
  const {
    jsx = false,
    format: _format = "mdx",
    outputFormat = "function-body",
    remarkPlugins,
    rehypePlugins,
    rehypePrettyCodeOptions
  } = {
    ...mdxOptions,
    // You can override MDX options in the frontMatter too.
    ...frontMatter.mdxOptions
  };
  const format = _format === "detect" ? filePath.endsWith(".mdx") ? "mdx" : "md" : _format;
  const isFileOutsideCWD = !isPageImport && path.relative(CWD, filePath).startsWith("..");
  const isRemoteContent = outputFormat === "function-body";
  const compiler = !useCachedCompiler || isRemoteContent ? createCompiler() : cachedCompilerForFormat[format] ?? (cachedCompilerForFormat[format] = createCompiler());
  const processor = compiler();
  try {
    const vFile = await processor.process(
      filePath ? { value: content, path: filePath } : content
    );
    const { title, hasJsxInH1, readingTime: readingTime2, structurizedData } = vFile.data;
    const result = String(vFile).replaceAll("__esModule", "_\\_esModule");
    return {
      result,
      ...title && { title },
      ...hasJsxInH1 && { hasJsxInH1 },
      ...readingTime2 && { readingTime: readingTime2 },
      ...searchIndexKey !== null && { searchIndexKey, structurizedData },
      ...isRemoteContent && { headings: vFile.data.headings },
      frontMatter
    };
  } catch (err) {
    console.error(`[nextra] Error compiling ${filePath}.`);
    throw err;
  }
  function createCompiler() {
    return createProcessor({
      jsx,
      format,
      outputFormat,
      providerImportSource: isFileOutsideCWD ? require2.resolve("nextra").replace(/index\.js$/, "mdx.js") : "nextra/mdx",
      remarkPlugins: [
        ...remarkPlugins || [],
        remarkMermaid,
        // should be before remarkRemoveImports because contains `import { Mermaid } from ...`
        [
          remarkNpm2Yarn,
          // should be before remarkRemoveImports because contains `import { Tabs as $Tabs, Tab as $Tab } from ...`
          {
            packageName: "nextra/components",
            tabNamesProp: "items",
            storageKey: "selectedPackageManager"
          }
        ],
        isRemoteContent && remarkRemoveImports,
        remarkGfm,
        format !== "md" && [
          remarkMdxDisableExplicitJsx,
          // Replace the <summary> and <details> with customized components
          { whiteList: ["details", "summary"] }
        ],
        remarkCustomHeadingId,
        [remarkHeadings, { isRemoteContent }],
        // structurize should be before remarkHeadings because we attach #id attribute to heading node
        flexsearch && [remarkStructurize, flexsearch],
        staticImage && remarkStaticImage,
        readingTime && remarkReadingTime,
        latex && remarkMath,
        isFileOutsideCWD && remarkReplaceImports,
        // Remove the markdown file extension from links
        [
          clonedRemarkLinkRewrite,
          {
            pattern: MARKDOWN_URL_EXTENSION_REGEX,
            replace: "",
            excludeExternalLinks: true
          }
        ]
      ].filter(truthy),
      rehypePlugins: [
        ...rehypePlugins || [],
        format === "md" && [
          // To render <details /> and <summary /> correctly
          rehypeRaw,
          // fix Error: Cannot compile `mdxjsEsm` node for npm2yarn and mermaid
          { passThrough: ["mdxjsEsm", "mdxJsxFlowElement"] }
        ],
        [parseMeta, { defaultShowCopyCode }],
        // Should be before `rehypePrettyCode`
        latex && rehypeKatex,
        codeHighlight !== false && [
          rehypePrettyCode,
          {
            ...DEFAULT_REHYPE_PRETTY_CODE_OPTIONS,
            ...rehypePrettyCodeOptions
          }
        ],
        attachMeta
      ].filter(truthy)
    });
  }
}
export {
  compileMdx
};
