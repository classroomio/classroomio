// src/ssg.tsx
import { MDXRemote } from "next-mdx-remote";
import { createContext, useContext } from "react";
import { useMDXComponents } from "./mdx";
import { jsx } from "react/jsx-runtime";
var SSGContext = createContext(false);
var useSSG = (key = "ssg") => useContext(SSGContext)?.[key];
var DataContext = SSGContext;
var useData = useSSG;
function RemoteContent({
  components: dynamicComponents
}) {
  const dynamicContext = useSSG("__nextra_dynamic_mdx");
  if (!dynamicContext) {
    throw new Error(
      "RemoteContent must be used together with the `buildDynamicMDX` API"
    );
  }
  const components = useMDXComponents(dynamicComponents);
  return /* @__PURE__ */ jsx(MDXRemote, { compiledSource: dynamicContext, components });
}
export {
  DataContext,
  RemoteContent,
  SSGContext,
  useData,
  useSSG
};
