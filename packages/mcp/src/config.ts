import { z } from 'zod';

const ZConfig = z.object({
  CLASSROOMIO_API_URL: z.url().default('https://api.classroomio.com'),
  CLASSROOMIO_API_KEY: z.string().min(1),
  CLASSROOMIO_USER_AGENT: z.string().min(1).default('classroomio-mcp/0.0.1')
});

export type McpServerConfig = z.infer<typeof ZConfig>;

export function getConfig(env: NodeJS.ProcessEnv = process.env): McpServerConfig {
  return ZConfig.parse(env);
}
