// src/components/steps.tsx
import cn from "clsx";
import { jsx } from "react/jsx-runtime";
function Steps({
  children,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "nextra-steps nx-ml-4 nx-mb-12 nx-border-l nx-border-gray-200 nx-pl-6",
        "dark:nx-border-neutral-800 [counter-reset:step]",
        className
      ),
      ...props,
      children
    }
  );
}
export {
  Steps
};
