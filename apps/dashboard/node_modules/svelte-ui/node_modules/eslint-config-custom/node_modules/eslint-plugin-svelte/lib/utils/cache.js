"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCache = void 0;
const SKIP_TIME = 5000;
function createCache() {
    const map = new Map();
    function get(key) {
        const entry = map.get(key);
        const now = Date.now();
        if (entry) {
            if (entry.expire > now) {
                entry.expire = now + SKIP_TIME;
                return entry.value;
            }
            map.delete(key);
        }
        return null;
    }
    function set(key, value) {
        const entry = map.get(key);
        const expire = Date.now() + SKIP_TIME;
        if (entry) {
            entry.value = value;
            entry.expire = expire;
        }
        else {
            map.set(key, { value, expire });
        }
    }
    return { get, set };
}
exports.createCache = createCache;
