// src/remote.ts
import { compileMdx } from "./compile.mjs";
async function buildDynamicMDX(content, compileMdxOptions) {
  if (compileMdxOptions && "remarkLinkRewriteOptions" in compileMdxOptions) {
    throw new Error(`\`remarkLinkRewriteOptions\` was removed. For overriding internal links use \`remarkLinkRewrite\` instead.

import { remarkLinkRewrite } from 'nextra/mdx-plugins'

// ...

const result = await buildDynamicMDX(rawMdx, {
  mdxOptions: {
    remarkPlugins: [
      [remarkLinkRewrite, {
        pattern: /^\\/docs(\\/.*)?$/,
        replace: '/docs/2.0.0$1'
      }]
    ]
  }
})
`);
  }
  const { result, headings, frontMatter, title } = await compileMdx(
    content,
    compileMdxOptions
  );
  return {
    __nextra_dynamic_mdx: result,
    __nextra_dynamic_opts: JSON.stringify({
      headings,
      frontMatter,
      title: frontMatter.title || title
    })
  };
}
async function buildDynamicMeta() {
  return {
    __nextra_pageMap: await globalThis.__nextra_resolvePageMap()
  };
}
export {
  buildDynamicMDX,
  buildDynamicMeta
};
