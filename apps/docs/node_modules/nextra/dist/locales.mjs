// src/locales.ts
import { addBasePath } from "next/dist/client/add-base-path";
import { addLocale } from "next/dist/client/add-locale";
import { hasBasePath } from "next/dist/client/has-base-path";
import { removeBasePath } from "next/dist/client/remove-base-path";
import { removeLocale } from "next/dist/client/remove-locale";
import { NextResponse } from "next/server";
function getCookie(cookies, key) {
  if (typeof cookies.get === "function") {
    const cookie = cookies.get(key);
    if (cookie && typeof cookie === "object") {
      return cookie.value;
    }
    return cookie;
  }
  return cookies[key];
}
function locales(request) {
  const { nextUrl } = request;
  if (/\/_meta(\.[a-z]{2}-[A-Z]{2})?$/.test(nextUrl.pathname)) {
    const url = nextUrl.clone();
    url.pathname = `/404`;
    return NextResponse.rewrite(url);
  }
  const shouldHandleLocale = !/^\/(api|_next)\//.test(nextUrl.pathname) && !/\.(jpe?g|svg|png|webmanifest|xml|ico|txt|mp4)$/.test(nextUrl.pathname) && nextUrl.locale !== "" && // not Server-Side Error page
  nextUrl.pathname !== "/500";
  if (!shouldHandleLocale)
    return;
  const locale = nextUrl.locale === nextUrl.defaultLocale ? "" : nextUrl.locale;
  nextUrl.pathname = hasBasePath(nextUrl.pathname) ? removeLocale(removeBasePath(nextUrl.pathname), nextUrl.locale) : nextUrl.pathname;
  let finalLocale;
  if (locale) {
    finalLocale = locale;
  } else {
    const clientLocale = getCookie(request.cookies, "NEXT_LOCALE");
    if (clientLocale) {
      try {
        nextUrl.locale = clientLocale;
      } catch {
      }
    }
    finalLocale = nextUrl.locale;
    if (finalLocale !== nextUrl.defaultLocale) {
      const url = addBasePath(
        addLocale(
          `${nextUrl.pathname}${nextUrl.search}`,
          finalLocale,
          nextUrl.defaultLocale
        )
      );
      return NextResponse.redirect(new URL(url, request.url));
    }
  }
  let pathname = nextUrl.pathname || "/";
  if (pathname === "/")
    pathname += "index";
  else if (pathname.endsWith("/"))
    pathname = pathname.slice(0, -1);
  if (!pathname.endsWith("." + finalLocale)) {
    const url = addBasePath(
      addLocale(
        `${pathname}.${finalLocale}${nextUrl.search}`,
        finalLocale,
        nextUrl.defaultLocale
      )
    );
    return NextResponse.rewrite(new URL(url, request.url));
  }
}
function withLocales(middleware) {
  return (...args) => {
    return locales(args[0]) || middleware(...args);
  };
}
export {
  locales,
  withLocales
};
