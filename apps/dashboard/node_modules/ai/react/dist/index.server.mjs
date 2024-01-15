// react/tokens.tsx
import { Suspense } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
async function Tokens(props) {
  const { stream } = props;
  const reader = stream.getReader();
  return /* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(RecursiveTokens, { reader }) });
}
async function RecursiveTokens({ reader }) {
  const { done, value } = await reader.read();
  if (done) {
    return null;
  }
  const text = new TextDecoder().decode(value);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    text,
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(RecursiveTokens, { reader }) })
  ] });
}
export {
  Tokens
};
