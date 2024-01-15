// src/components/copy-to-clipboard.tsx
import { useCallback, useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "../icons";
import { Button } from "./button";
import { jsx } from "react/jsx-runtime";
var CopyToClipboard = ({
  getValue,
  ...props
}) => {
  const [isCopied, setCopied] = useState(false);
  useEffect(() => {
    if (!isCopied)
      return;
    const timerId = setTimeout(() => {
      setCopied(false);
    }, 2e3);
    return () => {
      clearTimeout(timerId);
    };
  }, [isCopied]);
  const handleClick = useCallback(async () => {
    setCopied(true);
    if (!navigator?.clipboard) {
      console.error("Access to clipboard rejected!");
    }
    try {
      await navigator.clipboard.writeText(getValue());
    } catch {
      console.error("Failed to copy!");
    }
  }, [getValue]);
  const IconToUse = isCopied ? CheckIcon : CopyIcon;
  return /* @__PURE__ */ jsx(Button, { onClick: handleClick, title: "Copy code", tabIndex: 0, ...props, children: /* @__PURE__ */ jsx(IconToUse, { className: "nextra-copy-icon nx-pointer-events-none nx-h-4 nx-w-4" }) });
};
export {
  CopyToClipboard
};
