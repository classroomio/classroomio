// src/mdx-plugins/remark-link-rewrite.ts
import { visit } from "unist-util-visit";
import { EXTERNAL_URL_REGEX } from "../constants.mjs";
var remarkLinkRewrite = ({
  pattern,
  replace,
  excludeExternalLinks
}) => {
  return (tree, _file, done) => {
    visit(tree, "link", (node) => {
      if (!(excludeExternalLinks && EXTERNAL_URL_REGEX.test(node.url))) {
        node.url = node.url.replace(pattern, replace);
      }
    });
    done();
  };
};
export {
  remarkLinkRewrite
};
