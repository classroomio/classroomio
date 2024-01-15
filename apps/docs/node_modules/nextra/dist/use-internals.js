// src/use-internals.ts
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NEXTRA_INTERNAL } from "./constants.mjs";
function useInternals() {
  const __nextra_internal__ = globalThis[NEXTRA_INTERNAL];
  const { route } = useRouter();
  const rerender = useState({})[1];
  if (process.env.NODE_ENV !== "production") {
    useEffect(() => {
      const trigger = () => rerender({});
      const listeners = __nextra_internal__.refreshListeners;
      listeners[route] || (listeners[route] = []);
      listeners[route].push(trigger);
      return () => {
        listeners[route].splice(listeners[route].indexOf(trigger), 1);
      };
    }, [route, __nextra_internal__.refreshListeners, rerender]);
  }
  const context = __nextra_internal__.context[route];
  if (!context) {
    throw new Error(
      `No content found for the current route. This is a Nextra bug.`
    );
  }
  return {
    context,
    Layout: __nextra_internal__.Layout
  };
}
export {
  useInternals
};
