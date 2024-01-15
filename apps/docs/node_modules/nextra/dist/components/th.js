// src/components/th.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
var Th = ({ className = "", ...props }) => /* @__PURE__ */ jsx(
  "th",
  {
    className: cn(
      "nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600",
      className
    ),
    ...props
  }
);
export {
  Th
};
