// src/layout.tsx
import { SSGContext } from "./ssg";
import { useInternals } from "./use-internals";
import { jsx } from "react/jsx-runtime";
function Nextra({
  __nextra_pageMap,
  __nextra_dynamic_opts,
  ...props
}) {
  const { context, Layout } = useInternals();
  const { Content, ...restContext } = context;
  if (__nextra_pageMap) {
    restContext.pageOpts = {
      ...restContext.pageOpts,
      pageMap: __nextra_pageMap
    };
  }
  if (__nextra_dynamic_opts) {
    const { headings, title, frontMatter } = JSON.parse(__nextra_dynamic_opts);
    restContext.pageOpts = {
      ...restContext.pageOpts,
      headings,
      title,
      frontMatter
    };
  }
  return /* @__PURE__ */ jsx(Layout, { ...restContext, pageProps: props, children: /* @__PURE__ */ jsx(SSGContext.Provider, { value: props, children: /* @__PURE__ */ jsx(Content, { ...props }) }) });
}
export {
  Nextra as default
};
