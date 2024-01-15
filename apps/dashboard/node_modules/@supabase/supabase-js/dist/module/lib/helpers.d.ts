import { SupabaseClientOptions } from './types';
export declare function uuid(): string;
export declare function stripTrailingSlash(url: string): string;
export declare const isBrowser: () => boolean;
export declare function applySettingDefaults<Database = any, SchemaName extends string & keyof Database = 'public' extends keyof Database ? 'public' : string & keyof Database>(options: SupabaseClientOptions<SchemaName>, defaults: SupabaseClientOptions<any>): SupabaseClientOptions<SchemaName>;
//# sourceMappingURL=helpers.d.ts.map