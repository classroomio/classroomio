import LRUCache from "next/dist/compiled/lru-cache";
import path from "../../../shared/lib/isomorphic/path";
export default class FileSystemCache {
    constructor(ctx){
        this.fs = ctx.fs;
        this.flushToDisk = ctx.flushToDisk;
        this.serverDistDir = ctx.serverDistDir;
        this.appDir = !!ctx._appDir;
        if (ctx.maxMemoryCacheSize) {
            this.memoryCache = new LRUCache({
                max: ctx.maxMemoryCacheSize,
                length ({ value  }) {
                    var ref;
                    if (!value) {
                        return 25;
                    } else if (value.kind === "REDIRECT") {
                        return JSON.stringify(value.props).length;
                    } else if (value.kind === "IMAGE") {
                        throw new Error("invariant image should not be incremental-cache");
                    }
                    // rough estimate of size of cache value
                    return value.html.length + (((ref = JSON.stringify(value.pageData)) == null ? void 0 : ref.length) || 0);
                }
            });
        }
    }
    async get(key) {
        var ref;
        let data = (ref = this.memoryCache) == null ? void 0 : ref.get(key);
        // let's check the disk for seed data
        if (!data) {
            try {
                var ref1;
                const { filePath: htmlPath , isAppPath  } = await this.getFsPath(`${key}.html`);
                const html = await this.fs.readFile(htmlPath);
                const pageData = isAppPath ? await this.fs.readFile((await this.getFsPath(`${key}.rsc`, true)).filePath) : JSON.parse(await this.fs.readFile(await (await this.getFsPath(`${key}.json`, false)).filePath));
                const { mtime  } = await this.fs.stat(htmlPath);
                data = {
                    lastModified: mtime.getTime(),
                    value: {
                        kind: "PAGE",
                        html,
                        pageData
                    }
                };
                (ref1 = this.memoryCache) == null ? void 0 : ref1.set(key, data);
            } catch (_) {
            // unable to get data from disk
            }
        }
        return data || null;
    }
    async set(key, data) {
        var ref;
        if (!this.flushToDisk) return;
        (ref = this.memoryCache) == null ? void 0 : ref.set(key, {
            value: data,
            lastModified: Date.now()
        });
        if ((data == null ? void 0 : data.kind) === "PAGE") {
            const isAppPath = typeof data.pageData === "string";
            const { filePath: htmlPath  } = await this.getFsPath(`${key}.html`, isAppPath);
            await this.fs.mkdir(path.dirname(htmlPath));
            await this.fs.writeFile(htmlPath, data.html);
            await this.fs.writeFile((await this.getFsPath(`${key}.${isAppPath ? "rsc" : "json"}`, isAppPath)).filePath, isAppPath ? data.pageData : JSON.stringify(data.pageData));
        }
    }
    async getFsPath(pathname, appDir) {
        let isAppPath = false;
        let filePath = path.join(this.serverDistDir, "pages", pathname);
        if (!this.appDir || appDir === false) return {
            filePath,
            isAppPath
        };
        try {
            await this.fs.readFile(filePath);
            return {
                filePath,
                isAppPath
            };
        } catch (err) {
            return {
                filePath: path.join(this.serverDistDir, "app", pathname),
                isAppPath: true
            };
        }
    }
};

//# sourceMappingURL=file-system-cache.js.map