import { warn } from "../../build/output/log";
import http from "http";
import next from "../next";
export function startServer(opts) {
    let requestHandler;
    const server = http.createServer((req, res)=>{
        return requestHandler(req, res);
    });
    if (opts.keepAliveTimeout) {
        server.keepAliveTimeout = opts.keepAliveTimeout;
    }
    return new Promise((resolve, reject)=>{
        let port = opts.port;
        let retryCount = 0;
        server.on("error", (err)=>{
            if (port && opts.allowRetry && err.code === "EADDRINUSE" && retryCount < 10) {
                warn(`Port ${port} is in use, trying ${port + 1} instead.`);
                port += 1;
                retryCount += 1;
                server.listen(port, opts.hostname);
            } else {
                reject(err);
            }
        });
        let upgradeHandler;
        if (!opts.dev) {
            server.on("upgrade", (req, socket, upgrade)=>{
                upgradeHandler(req, socket, upgrade);
            });
        }
        server.on("listening", ()=>{
            const addr = server.address();
            const hostname = !opts.hostname || opts.hostname === "0.0.0.0" ? "localhost" : opts.hostname;
            const app = next({
                ...opts,
                hostname,
                customServer: false,
                httpServer: server,
                port: addr && typeof addr === "object" ? addr.port : port
            });
            requestHandler = app.getRequestHandler();
            upgradeHandler = app.getUpgradeHandler();
            resolve(app);
        });
        server.listen(port, opts.hostname);
    });
}

//# sourceMappingURL=start-server.js.map