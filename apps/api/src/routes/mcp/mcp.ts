import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { AppError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import {
  authenticateMcpCredentialService,
  createRemoteMcpServer,
  getMcpResourceMetadataUrl
} from '@api/services/mcp/mcp';

const JSON_RPC_INVALID_REQUEST = -32600;

function jsonRpcError(message: string) {
  return { jsonrpc: '2.0', error: { code: JSON_RPC_INVALID_REQUEST, message }, id: null };
}

export const mcpRouter = new Hono()
  .post('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    const credential = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
    const challenge = `Bearer resource_metadata="${getMcpResourceMetadataUrl()}"`;

    if (!credential) {
      return c.json(jsonRpcError('Authentication required'), 401, { 'WWW-Authenticate': challenge });
    }

    try {
      await authenticateMcpCredentialService(credential);
    } catch (error) {
      if (!(error instanceof AppError) || error.statusCode >= 500) throw error;

      if (error.statusCode === 403) {
        return c.json(jsonRpcError(error.message), 403);
      }

      return c.json(jsonRpcError('Invalid or expired credential'), 401, { 'WWW-Authenticate': challenge });
    }

    const server = createRemoteMcpServer({ credential, requestHeaders: c.req.raw.headers, env: c.env });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    try {
      await server.connect(transport);

      return await transport.handleRequest(c.req.raw);
    } finally {
      await transport.close();
      await server.close();
    }
  })
  .on(['GET', 'DELETE'], '/', (c) =>
    c.json(jsonRpcError('This endpoint only accepts POST requests'), 405, { Allow: 'POST' })
  );
