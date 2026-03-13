import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ClassroomIoApiClient, ClassroomIoApiError } from './api-client.js';
import { getConfig } from './config.js';
import { registerCourseDraftTools } from './tools/course-drafts.js';

async function main() {
  const config = getConfig();
  const apiClient = new ClassroomIoApiClient(config);
  const server = new McpServer({
    name: 'classroomio-course-authoring',
    version: '0.0.1'
  });

  registerCourseDraftTools(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stdin.on('close', () => {
    void server.close();
  });
}

main().catch((error: unknown) => {
  if (error instanceof ClassroomIoApiError) {
    console.error(
      JSON.stringify({
        error: error.message,
        status: error.status,
        code: error.code,
        field: error.field
      })
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
