// src/icons/arrow-right.tsx
import { jsx } from "react/jsx-runtime";
function ArrowRightIcon({
  pathClassName,
  ...props
}) {
  return /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M9 5l7 7-7 7",
      className: pathClassName
    }
  ) });
}
export {
  ArrowRightIcon
};
