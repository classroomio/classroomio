// src/components/code.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
var Code = ({
  children,
  className,
  ...props
}) => {
  const hasLineNumbers = "data-line-numbers" in props;
  return /* @__PURE__ */ jsx(
    "code",
    {
      className: cn(
        "nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em]",
        "dark:nx-border-white/10 dark:nx-bg-white/10",
        hasLineNumbers && "[counter-reset:line]",
        className
      ),
      dir: "ltr",
      ...props,
      children
    }
  );
};
export {
  Code
};
