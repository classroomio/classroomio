import { z } from 'zod';

/** Replaced with the package version at build time; absent when run from source. */
declare const __MCP_VERSION__: string | undefined;

const packageVersion = typeof __MCP_VERSION__ === 'string' ? __MCP_VERSION__ : 'dev';

const ZConfig = z.object({
  CLASSROOMIO_API_URL: z.url().default('https://api.classroomio.com'),
  CLASSROOMIO_API_KEY: z.string().min(1),
  CLASSROOMIO_USER_AGENT: z.string().min(1).default(`classroomio-mcp/${packageVersion}`)
});

export type McpServerConfig = z.infer<typeof ZConfig>;

export function getConfig(env: NodeJS.ProcessEnv = process.env): McpServerConfig {
  return ZConfig.parse(env);
}
