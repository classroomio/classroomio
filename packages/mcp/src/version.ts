/** Replaced with the package version at build time; absent when run from source. */
declare const __MCP_VERSION__: string | undefined;

export const MCP_VERSION = typeof __MCP_VERSION__ === 'string' ? __MCP_VERSION__ : 'dev';
