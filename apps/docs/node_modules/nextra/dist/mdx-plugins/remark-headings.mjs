// src/mdx-plugins/remark-headings.ts
import Slugger from "github-slugger";
import { visit } from "unist-util-visit";
import { MARKDOWN_EXTENSION_REGEX } from "../constants.mjs";
var getFlattenedValue = (node) => node.children.map(
  (child) => "children" in child ? getFlattenedValue(child) : "value" in child ? child.value : ""
).join("");
var SKIP_FOR_PARENT_NAMES = /* @__PURE__ */ new Set(["Tab", "Tabs.Tab"]);
var remarkHeadings = ({ exportName = "__toc", isRemoteContent }) => {
  const headings = [];
  let hasJsxInH1;
  let title;
  const slugger = new Slugger();
  return (tree, file, done) => {
    const PartialComponentToHeadingsName = /* @__PURE__ */ Object.create(null);
    visit(
      tree,
      [
        "heading",
        // push partial component's __toc export name to headings list
        "mdxJsxFlowElement",
        // verify .md/.mdx exports and attach named __toc export
        "mdxjsEsm"
      ],
      (node, _index, parent) => {
        var _a;
        if (node.type === "heading") {
          if (node.depth === 1) {
            const hasJsx = node.children.some(
              (child) => child.type === "mdxJsxTextElement"
            );
            if (hasJsx) {
              hasJsxInH1 = true;
            }
            title || (title = getFlattenedValue(node));
            return;
          }
          node.data || (node.data = {});
          const headingProps = (_a = node.data).hProperties || (_a.hProperties = {});
          if (SKIP_FOR_PARENT_NAMES.has(parent.name)) {
            delete headingProps.id;
          } else {
            const value = getFlattenedValue(node);
            const id = slugger.slug(headingProps.id || value);
            headingProps.id = id;
            headings.push({ depth: node.depth, value, id });
          }
          return;
        }
        if (isRemoteContent) {
        } else if (node.type === "mdxjsEsm") {
          for (const child of node.data.estree.body) {
            if (child.type !== "ImportDeclaration")
              continue;
            const importPath = child.source.value;
            const isMdxImport = MARKDOWN_EXTENSION_REGEX.test(importPath);
            if (!isMdxImport)
              continue;
            const componentName = child.specifiers.find(
              (o) => o.type === "ImportDefaultSpecifier"
            )?.local.name;
            if (!componentName)
              continue;
            const { length } = Object.keys(PartialComponentToHeadingsName);
            const exportAsName = `${exportName}${length}`;
            PartialComponentToHeadingsName[componentName] = exportAsName;
            child.specifiers.push({
              type: "ImportSpecifier",
              imported: { type: "Identifier", name: exportName },
              local: { type: "Identifier", name: exportAsName }
            });
          }
        } else {
          const headingsName = PartialComponentToHeadingsName[node.name];
          if (headingsName) {
            headings.push(headingsName);
          }
        }
      }
    );
    file.data.hasJsxInH1 = hasJsxInH1;
    file.data.title = title;
    if (isRemoteContent) {
      file.data.headings = headings;
      done();
      return;
    }
    const headingElements = headings.map(
      (heading) => typeof heading === "string" ? {
        type: "SpreadElement",
        argument: { type: "Identifier", name: heading }
      } : {
        type: "ObjectExpression",
        properties: Object.entries(heading).map(([key, value]) => ({
          type: "Property",
          kind: "init",
          key: { type: "Identifier", name: key },
          value: { type: "Literal", value }
        }))
      }
    );
    tree.children.push({
      type: "mdxjsEsm",
      data: {
        estree: {
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: exportName },
                    init: { type: "ArrayExpression", elements: headingElements }
                  }
                ]
              }
            }
          ]
        }
      }
    });
    done();
  };
};
export {
  remarkHeadings
};
