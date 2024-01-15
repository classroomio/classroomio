// src/mdx-plugins/remark-mdx-disable-explicit-jsx.ts
import { visit } from "unist-util-visit";
var remarkMdxDisableExplicitJsx = ({ whiteList }) => (tree) => {
  const test = whiteList.map((name) => ({ name }));
  visit(tree, test, (node) => {
    delete node.data._mdxExplicitJsx;
  });
};
export {
  remarkMdxDisableExplicitJsx
};
