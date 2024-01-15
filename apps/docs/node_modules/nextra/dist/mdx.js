// src/mdx.ts
import { useMDXComponents as originalUseMDXComponents } from "@mdx-js/react";
import Image from "next/image";
import { createElement } from "react";
import { MDXProvider } from "@mdx-js/react";
var DEFAULT_COMPONENTS = {
  img: (props) => createElement(
    typeof props.src === "object" ? Image : "img",
    props
  )
};
var useMDXComponents = (components) => {
  return originalUseMDXComponents({
    ...DEFAULT_COMPONENTS,
    ...components
  });
};
export {
  MDXProvider,
  useMDXComponents
};
