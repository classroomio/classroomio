declare type Fetch = typeof fetch;
export declare const resolveFetch: (customFetch?: Fetch) => Fetch;
export declare const resolveHeadersConstructor: () => {
    new (init?: HeadersInit | undefined): Headers;
    prototype: Headers;
};
export declare const fetchWithAuth: (supabaseKey: string, getAccessToken: () => Promise<string | null>, customFetch?: Fetch) => Fetch;
export {};
//# sourceMappingURL=fetch.d.ts.map