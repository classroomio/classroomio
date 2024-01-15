// src/webpack-plugins/nextra.ts
import { PAGES_DIR } from "../file-system.mjs";
import { pageMapCache } from "../page-map.mjs";
import { collectFiles } from "../plugin.mjs";
var NextraPlugin = class {
  constructor(config) {
    this.config = config;
  }
  apply(compiler) {
    const pluginName = this.constructor.name;
    compiler.hooks.beforeCompile.tapAsync(pluginName, async (_, callback) => {
      const { locales } = this.config;
      try {
        const result = await collectFiles({ dir: PAGES_DIR, locales });
        pageMapCache.set(result);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }
};
export {
  NextraPlugin
};
