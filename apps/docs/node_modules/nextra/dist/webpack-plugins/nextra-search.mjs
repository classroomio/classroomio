// src/webpack-plugins/nextra-search.ts
import { sources, webpack } from "next/dist/compiled/webpack/webpack";
import { IS_PRODUCTION } from "../constants.mjs";
var NextraSearchPlugin = class {
  apply(compiler) {
    const pluginName = this.constructor.name;
    compiler.hooks.make.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        (assets) => {
          const indexFiles = {};
          for (const entry of compilation.entries.values()) {
            const entryDependency = entry.dependencies?.[0];
            let entryModule = compilation.moduleGraph.getResolvedModule(entryDependency);
            if (entryModule && !entryModule.buildInfo?.nextraSearch) {
              for (const dependency of entryModule.dependencies) {
                const mod = compilation.moduleGraph.getResolvedModule(dependency);
                if (mod?.buildInfo?.nextraSearch) {
                  entryModule = mod;
                }
              }
            }
            const nextraSearch = entryModule?.buildInfo?.nextraSearch;
            if (nextraSearch) {
              const { title, data, indexKey, route } = nextraSearch;
              const indexFilename = `nextra-data-${indexKey}.json`;
              indexFiles[indexFilename] ?? (indexFiles[indexFilename] = {});
              indexFiles[indexFilename][route] = { title, data };
            }
          }
          for (const [file, content] of Object.entries(indexFiles)) {
            assets[`${IS_PRODUCTION ? "../" : ""}../static/chunks/${file}`] = new sources.RawSource(JSON.stringify(content));
          }
        }
      );
    });
  }
};
export {
  NextraSearchPlugin
};
