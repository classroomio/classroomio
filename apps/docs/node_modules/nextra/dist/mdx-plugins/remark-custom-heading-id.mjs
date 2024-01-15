// src/mdx-plugins/remark-custom-heading-id.ts
import { visit } from "unist-util-visit";
var remarkCustomHeadingId = () => (tree, _file, done) => {
  visit(tree, "heading", (node) => {
    var _a;
    const lastChild = node.children.at(-1);
    if (!lastChild || lastChild.type !== "text")
      return;
    const heading = lastChild.value;
    const matched = heading.match(/\s*\[#([^]+?)]\s*$/);
    if (!matched)
      return;
    node.data || (node.data = {});
    const headingProps = (_a = node.data).hProperties || (_a.hProperties = {});
    headingProps.id = matched[1];
    lastChild.value = heading.slice(0, matched.index);
  });
  done();
};
export {
  remarkCustomHeadingId
};
