import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import { ClassroomIoApiClient } from './api-client';
import { createMcpServer } from './server';

async function connect(options: { includeLocalFileTools: boolean }) {
  const apiClient = new ClassroomIoApiClient({
    CLASSROOMIO_API_URL: 'https://api.example.com',
    CLASSROOMIO_API_KEY: 'cio_mcp_test',
    CLASSROOMIO_USER_AGENT: 'test'
  });
  const server = createMcpServer(apiClient, options);
  const client = new Client({ name: 'test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return client;
}

describe('createMcpServer', () => {
  it('registers the local file tools for a local stdio process', async () => {
    const client = await connect({ includeLocalFileTools: true });
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).toContain('upload_video');
    expect(names).toContain('list_team_members');
  });

  it('omits tools that read the server filesystem for remote use', async () => {
    const client = await connect({ includeLocalFileTools: false });
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).not.toContain('upload_video');
    expect(names).toContain('list_team_members');
  });

  it('exposes the same tools apart from the local file tools', async () => {
    const local = (await (await connect({ includeLocalFileTools: true })).listTools()).tools.map((tool) => tool.name);
    const remote = (await (await connect({ includeLocalFileTools: false })).listTools()).tools.map((tool) => tool.name);

    expect(local.filter((name) => !remote.includes(name))).toEqual(['upload_video']);
  });
});

describe('ClassroomIoApiClient transport', () => {
  it('sends requests through the injected fetch with the extra headers', async () => {
    const requests: Request[] = [];
    const apiClient = new ClassroomIoApiClient(
      {
        CLASSROOMIO_API_URL: 'https://api.example.com',
        CLASSROOMIO_API_KEY: 'token-1',
        CLASSROOMIO_USER_AGENT: 'agent'
      },
      {
        fetch: async (input, init) => {
          requests.push(new Request(input, init));

          return new Response(JSON.stringify({ success: true, data: [], pagination: {} }));
        },
        headers: { 'cf-connecting-ip': '203.0.113.7' }
      }
    );

    await apiClient.listTeamMembers({});

    expect(requests).toHaveLength(1);
    expect(requests[0]!.headers.get('authorization')).toBe('Bearer token-1');
    expect(requests[0]!.headers.get('cf-connecting-ip')).toBe('203.0.113.7');
  });
});
