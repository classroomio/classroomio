// src/icons/menu.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function MenuIcon(props) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      fill: "none",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      ...props,
      children: [
        /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M4 6h16"
          }
        ) }),
        /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M4 12h16"
          }
        ),
        /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M4 18h16"
          }
        ) })
      ]
    }
  );
}
export {
  MenuIcon
};
