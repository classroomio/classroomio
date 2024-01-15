// src/hooks/use-fs-route.ts
import { useRouter } from "next/router";
import { useMemo } from "react";
import { DEFAULT_LOCALE, ERROR_ROUTES } from "../constants.mjs";
var template = "https://nextra.vercel.app";
var useFSRoute = () => {
  const { locale = DEFAULT_LOCALE, asPath, route } = useRouter();
  return useMemo(() => {
    const clientRoute = ERROR_ROUTES.has(route) ? route : asPath;
    const { pathname } = new URL(clientRoute, template);
    const cleanedPath = locale ? pathname.replace(new RegExp(`\\.${locale}(\\/|$)`), "$1") : pathname;
    return cleanedPath.replace(/\.html$/, "").replace(/\/index(\/|$)/, "$1").replace(/\/$/, "") || "/";
  }, [asPath, locale, route]);
};
export {
  useFSRoute
};
