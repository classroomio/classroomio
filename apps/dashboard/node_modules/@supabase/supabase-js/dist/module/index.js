import SupabaseClient from './SupabaseClient';
export * from '@supabase/gotrue-js';
export { FunctionsHttpError, FunctionsFetchError, FunctionsRelayError, FunctionsError, } from '@supabase/functions-js';
export * from '@supabase/realtime-js';
export { default as SupabaseClient } from './SupabaseClient';
/**
 * Creates a new Supabase Client.
 */
export const createClient = (supabaseUrl, supabaseKey, options) => {
    return new SupabaseClient(supabaseUrl, supabaseKey, options);
};
//# sourceMappingURL=index.js.map