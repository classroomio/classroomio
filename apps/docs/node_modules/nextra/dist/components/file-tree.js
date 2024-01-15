// src/components/file-tree.tsx
import cn from "clsx";
import { createContext, memo, useCallback, useContext, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var ctx = createContext(0);
function useIndent() {
  return useContext(ctx);
}
function Tree({ children }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "nextra-filetree nx-mt-6 nx-select-none nx-text-sm nx-text-gray-800 dark:nx-text-gray-300",
        "nx-not-prose"
        // for nextra-theme-blog
      ),
      children: /* @__PURE__ */ jsx("div", { className: "nx-inline-block nx-rounded-lg nx-border nx-px-4 nx-py-2 dark:nx-border-neutral-800", children })
    }
  );
}
function Ident() {
  const length = useIndent();
  return /* @__PURE__ */ jsx(Fragment, { children: Array.from({ length }, (_, i) => /* @__PURE__ */ jsx("span", { className: "nx-w-5" }, i)) });
}
var Folder = memo(
  ({ label, name, open, children, defaultOpen = false, onToggle }) => {
    const indent = useIndent();
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const toggle = useCallback(() => {
      onToggle?.(!isOpen);
      setIsOpen(!isOpen);
    }, [isOpen, onToggle]);
    const isFolderOpen = open === void 0 ? isOpen : open;
    return /* @__PURE__ */ jsxs("li", { className: "nx-flex nx-list-none nx-flex-col", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: toggle,
          title: name,
          className: "nx-inline-flex nx-cursor-pointer nx-items-center nx-py-1 hover:nx-opacity-60",
          children: [
            /* @__PURE__ */ jsx(Ident, {}),
            /* @__PURE__ */ jsx("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
              "path",
              {
                fill: "none",
                stroke: "currentColor",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: isFolderOpen ? "M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2Z" : "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"
              }
            ) }),
            /* @__PURE__ */ jsx("span", { className: "nx-ml-1", children: label ?? name })
          ]
        }
      ),
      isFolderOpen && /* @__PURE__ */ jsx("ul", { children: /* @__PURE__ */ jsx(ctx.Provider, { value: indent + 1, children }) })
    ] });
  }
);
Folder.displayName = "Folder";
var File = memo(({ label, name, active }) => /* @__PURE__ */ jsx(
  "li",
  {
    className: cn(
      "nx-flex nx-list-none",
      active && "nx-text-primary-600 contrast-more:nx-underline"
    ),
    children: /* @__PURE__ */ jsxs("span", { className: "nx-inline-flex nx-cursor-default nx-items-center nx-py-1", children: [
      /* @__PURE__ */ jsx(Ident, {}),
      /* @__PURE__ */ jsx("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
        "path",
        {
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "2",
          d: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        }
      ) }),
      /* @__PURE__ */ jsx("span", { className: "nx-ml-1", children: label ?? name })
    ] })
  }
));
File.displayName = "File";
var FileTree = Object.assign(Tree, { Folder, File });
export {
  FileTree
};
