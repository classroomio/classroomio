"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthClient = void 0;
const gotrue_js_1 = require("@supabase/gotrue-js");
class SupabaseAuthClient extends gotrue_js_1.GoTrueClient {
    constructor(options) {
        super(options);
    }
}
exports.SupabaseAuthClient = SupabaseAuthClient;
//# sourceMappingURL=SupabaseAuthClient.js.map