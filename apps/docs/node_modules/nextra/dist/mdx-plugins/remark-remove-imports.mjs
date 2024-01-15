// src/mdx-plugins/remark-remove-imports.ts
import { remove } from "unist-util-remove";
var remarkRemoveImports = () => {
  return (tree, _file, done) => {
    remove(tree, "mdxjsEsm");
    done();
  };
};
export {
  remarkRemoveImports
};
