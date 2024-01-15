// src/mdx-plugins/remark-static-image.ts
import path from "path";
import slash from "slash";
import { visit } from "unist-util-visit";
import { EXTERNAL_URL_REGEX, PUBLIC_DIR } from "../constants.mjs";
import { existsSync } from "../file-system.mjs";
import { truthy } from "../utils.mjs";
var VALID_BLUR_EXT = [".jpeg", ".png", ".webp", ".avif", ".jpg"];
var remarkStaticImage = () => (tree, _file, done) => {
  const importsToInject = [];
  visit(tree, "image", (node) => {
    let url = decodeURI(node.url);
    if (!url) {
      return;
    }
    if (EXTERNAL_URL_REGEX.test(url)) {
      return;
    }
    if (url.startsWith("/")) {
      const urlPath = path.join(PUBLIC_DIR, url);
      if (!existsSync(urlPath)) {
        return;
      }
      url = slash(urlPath);
    }
    const variableName = `__img${importsToInject.length}`;
    const hasBlur = VALID_BLUR_EXT.some((ext) => url.endsWith(ext));
    importsToInject.push({ variableName, importPath: url });
    Object.assign(node, {
      type: "mdxJsxFlowElement",
      name: "img",
      attributes: [
        // do not render empty alt in html markup
        node.alt && {
          type: "mdxJsxAttribute",
          name: "alt",
          value: node.alt
        },
        hasBlur && {
          type: "mdxJsxAttribute",
          name: "placeholder",
          value: "blur"
        },
        {
          type: "mdxJsxAttribute",
          name: "src",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: variableName,
            data: {
              estree: {
                body: [
                  {
                    type: "ExpressionStatement",
                    expression: { type: "Identifier", name: variableName }
                  }
                ]
              }
            }
          }
        }
      ].filter(truthy)
    });
  });
  if (importsToInject.length) {
    tree.children.unshift(
      ...importsToInject.map(
        ({ variableName, importPath }) => ({
          type: "mdxjsEsm",
          data: {
            estree: {
              body: [
                {
                  type: "ImportDeclaration",
                  source: { type: "Literal", value: importPath },
                  specifiers: [
                    {
                      type: "ImportDefaultSpecifier",
                      local: { type: "Identifier", name: variableName }
                    }
                  ]
                }
              ]
            }
          }
        })
      )
    );
  }
  done();
};
export {
  remarkStaticImage
};
