// src/mdx-plugins/remark-structurize.ts
var CODE_TABLE_QUOTE_LIST = /* @__PURE__ */ new Set([
  "code",
  "table",
  "blockquote",
  "list",
  "mdxJsxFlowElement"
]);
var remarkStructurize = (options) => {
  const opts = { codeblocks: true, ...options };
  const structurizedData = /* @__PURE__ */ Object.create(null);
  let activeSlug = "";
  let skip = false;
  let content = "";
  return (tree, file, done) => {
    walk(tree);
    save();
    file.data.structurizedData = structurizedData;
    done();
  };
  function save() {
    const cleanedContent = content.trim().replaceAll(/\w{50,}/g, "").replaceAll(/\n+/g, "\n");
    if (activeSlug || cleanedContent) {
      structurizedData[activeSlug] = cleanedContent;
    }
  }
  function walk(node) {
    let result = "";
    const { type } = node;
    if (type === "heading") {
      skip = true;
    }
    if (CODE_TABLE_QUOTE_LIST.has(type)) {
      result += "\n";
      if (!skip)
        content += "\n";
    }
    if ("children" in node) {
      for (const child of node.children) {
        result += walk(child);
      }
    } else if (opts.codeblocks && type === "code" || ["text", "inlineCode", "tableCell"].includes(type)) {
      result += node.value;
      if (!skip)
        content += node.value;
    }
    if (CODE_TABLE_QUOTE_LIST.has(type) || ["listItem", "break"].includes(type)) {
      result += "\n";
      if (!skip)
        content += "\n";
    }
    if (type === "tableCell") {
      result += "	";
      if (!skip)
        content += "	";
    } else if (type === "heading") {
      skip = false;
      if (node.depth > 1) {
        save();
        content = "";
        activeSlug = node.data.hProperties.id + "#" + result;
      }
    }
    return result;
  }
};
export {
  remarkStructurize
};
