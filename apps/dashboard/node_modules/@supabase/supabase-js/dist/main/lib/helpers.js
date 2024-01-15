"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySettingDefaults = exports.isBrowser = exports.stripTrailingSlash = exports.uuid = void 0;
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.uuid = uuid;
function stripTrailingSlash(url) {
    return url.replace(/\/$/, '');
}
exports.stripTrailingSlash = stripTrailingSlash;
const isBrowser = () => typeof window !== 'undefined';
exports.isBrowser = isBrowser;
function applySettingDefaults(options, defaults) {
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions, } = options;
    const { db: DEFAULT_DB_OPTIONS, auth: DEFAULT_AUTH_OPTIONS, realtime: DEFAULT_REALTIME_OPTIONS, global: DEFAULT_GLOBAL_OPTIONS, } = defaults;
    return {
        db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS), dbOptions),
        auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), authOptions),
        realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS), realtimeOptions),
        global: Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS), globalOptions),
    };
}
exports.applySettingDefaults = applySettingDefaults;
//# sourceMappingURL=helpers.js.map