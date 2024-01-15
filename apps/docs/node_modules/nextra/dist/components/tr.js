// src/components/tr.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
var Tr = ({ className = "", ...props }) => /* @__PURE__ */ jsx(
  "tr",
  {
    className: cn(
      "nx-m-0 nx-border-t nx-border-gray-300 nx-p-0 dark:nx-border-gray-600",
      "even:nx-bg-gray-100 even:dark:nx-bg-gray-600/20",
      className
    ),
    ...props
  }
);
export {
  Tr
};
