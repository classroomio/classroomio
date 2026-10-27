import { ClassroomIoApiClient, ClassroomIoApiError } from './api-client';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getConfig } from './config';
import { createMcpServer } from './server';

async function main() {
  const config = getConfig();
  const apiClient = new ClassroomIoApiClient(config);
  const server = createMcpServer(apiClient, { includeLocalFileTools: true });

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
