// src/components/table.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
var Table = ({
  className = "",
  ...props
}) => /* @__PURE__ */ jsx(
  "table",
  {
    className: cn("nx-block nx-overflow-x-scroll", className),
    ...props
  }
);
export {
  Table
};
