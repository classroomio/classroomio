// src/mdx-plugins/remark-replace-imports.ts
import { createRequire } from "module";
import { visit } from "unist-util-visit";
var require2 = createRequire(import.meta.url);
var remarkReplaceImports = () => {
  return (tree, _file, done) => {
    visit(tree, "mdxjsEsm", (node) => {
      const { source } = node.data.estree.body[0];
      const absolutePath = require2.resolve(source.value);
      source.value = absolutePath;
      source.raw = `"${absolutePath}"`;
    });
    done();
  };
};
export {
  remarkReplaceImports
};
