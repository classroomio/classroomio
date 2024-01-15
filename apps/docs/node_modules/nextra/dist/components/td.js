// src/components/td.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
var Td = ({ className = "", ...props }) => /* @__PURE__ */ jsx(
  "td",
  {
    className: cn(
      "nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600",
      className
    ),
    ...props
  }
);
export {
  Td
};
