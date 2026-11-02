import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';

import { AppError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import {
  authenticateMcpCredentialService,
  createRemoteMcpServer,
  getMcpResourceMetadataUrl
} from '@api/services/mcp/mcp';

const JSON_RPC_INVALID_REQUEST = -32600;
const MCP_ACCEPT = 'application/json, text/event-stream';

/**
 * Clients such as ChatGPT send a protocol version newer than the SDK knows, which the transport answers
 * with 400. Dropping an unknown version makes the transport assume its default, so the request is served.
 */
function normalizeMcpRequest(request: Request): Request {
  const accept = request.headers.get('Accept') ?? '';
  const protocolVersion = request.headers.get('Mcp-Protocol-Version');
  const hasStreamableAccept = accept.includes('application/json') && accept.includes('text/event-stream');
  const hasUnknownVersion = protocolVersion !== null && !SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion);

  if (hasStreamableAccept && !hasUnknownVersion) return request;

  const headers = new Headers(request.headers);

  if (!hasStreamableAccept) headers.set('Accept', MCP_ACCEPT);
  if (hasUnknownVersion) headers.delete('Mcp-Protocol-Version');

  return new Request(request, { headers });
}

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

      const response = await transport.handleRequest(normalizeMcpRequest(c.req.raw));

      if (response.status >= 400) {
        const rejection = await response.clone().text();
        console.warn('mcp request rejected', {
          status: response.status,
          accept: c.req.header('Accept'),
          contentType: c.req.header('Content-Type'),
          protocolVersion: c.req.header('Mcp-Protocol-Version'),
          userAgent: c.req.header('User-Agent'),
          rejection: rejection.slice(0, 500)
        });
      }

      return response;
    } finally {
      await transport.close();
      await server.close();
    }
  })
  .on(['GET', 'DELETE'], '/', (c) =>
    c.json(jsonRpcError('This endpoint only accepts POST requests'), 405, { Allow: 'POST' })
  );
