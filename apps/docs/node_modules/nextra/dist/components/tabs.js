// src/components/tabs.tsx
import { Tab as HeadlessTab } from "@headlessui/react";
import cn from "clsx";
import { useCallback, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function isTabObjectItem(item) {
  return !!item && typeof item === "object" && "label" in item;
}
function _Tabs({
  items,
  selectedIndex: _selectedIndex,
  defaultIndex = 0,
  onChange,
  children,
  storageKey
}) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  useEffect(() => {
    if (_selectedIndex !== void 0) {
      setSelectedIndex(_selectedIndex);
    }
  }, [_selectedIndex]);
  useEffect(() => {
    if (!storageKey) {
      return;
    }
    function fn(event) {
      if (event.key === storageKey) {
        setSelectedIndex(Number(event.newValue));
      }
    }
    const index = Number(localStorage.getItem(storageKey));
    setSelectedIndex(Number.isNaN(index) ? 0 : index);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("storage", fn);
    };
  }, []);
  const handleChange = useCallback((index) => {
    if (storageKey) {
      const newValue = String(index);
      localStorage.setItem(storageKey, newValue);
      window.dispatchEvent(
        new StorageEvent("storage", { key: storageKey, newValue })
      );
      return;
    }
    setSelectedIndex(index);
    onChange?.(index);
  }, []);
  return /* @__PURE__ */ jsxs(
    HeadlessTab.Group,
    {
      selectedIndex,
      defaultIndex,
      onChange: handleChange,
      children: [
        /* @__PURE__ */ jsx("div", { className: "nextra-scrollbar nx-overflow-x-auto nx-overflow-y-hidden nx-overscroll-x-contain", children: /* @__PURE__ */ jsx(HeadlessTab.List, { className: "nx-mt-4 nx-flex nx-w-max nx-min-w-full nx-border-b nx-border-gray-200 nx-pb-px dark:nx-border-neutral-800", children: items.map((item, index) => {
          const disabled = isTabObjectItem(item) && item.disabled;
          return /* @__PURE__ */ jsx(
            HeadlessTab,
            {
              disabled,
              className: ({ selected }) => cn(
                "nx-mr-2 nx-rounded-t nx-p-2 nx-font-medium nx-leading-5 nx-transition-colors",
                "-nx-mb-0.5 nx-select-none nx-border-b-2",
                selected ? "nx-border-primary-500 nx-text-primary-600" : "nx-border-transparent nx-text-gray-600 hover:nx-border-gray-200 hover:nx-text-black dark:nx-text-gray-200 dark:hover:nx-border-neutral-800 dark:hover:nx-text-white",
                disabled && "nx-pointer-events-none nx-text-gray-400 dark:nx-text-neutral-600"
              ),
              children: isTabObjectItem(item) ? item.label : item
            },
            index
          );
        }) }) }),
        /* @__PURE__ */ jsx(HeadlessTab.Panels, { children })
      ]
    }
  );
}
function Tab({
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(HeadlessTab.Panel, { ...props, className: "nx-rounded nx-pt-6", children });
}
var Tabs = Object.assign(_Tabs, { displayName: "Tabs", Tab });
export {
  Tab,
  Tabs
};
