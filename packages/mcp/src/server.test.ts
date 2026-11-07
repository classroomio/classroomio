import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import { ClassroomIoApiClient } from './api-client';
import { createMcpServer } from './server';

async function connect(options: { includeLocalFileTools: boolean }, fetchImpl?: typeof fetch) {
  const apiClient = new ClassroomIoApiClient(
    {
      CLASSROOMIO_API_URL: 'https://api.example.com',
      CLASSROOMIO_API_KEY: 'cio_mcp_test',
      CLASSROOMIO_USER_AGENT: 'test'
    },
    fetchImpl ? { fetch: fetchImpl } : undefined
  );
  const server = createMcpServer(apiClient, options);
  const client = new Client({ name: 'test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return client;
}

describe('createMcpServer', () => {
  it('marks set_audience_status as destructive and requires confirm', async () => {
    const { tools } = await (await connect({ includeLocalFileTools: false })).listTools();
    const tool = tools.find((candidate) => candidate.name === 'set_audience_status');

    expect(tool?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
    expect(tool?.inputSchema.required).toContain('confirm');
  });

  it('returns an API failure as a tool error with its code and status', async () => {
    const refuse = async () =>
      new Response(JSON.stringify({ success: false, error: 'Student limit reached', code: 'UPGRADE_REQUIRED' }), {
        status: 403
      });
    const client = await connect({ includeLocalFileTools: false }, refuse);

    const result = await client.callTool({
      name: 'set_audience_status',
      arguments: { action: 'unarchive', memberIds: [1], confirm: true }
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse((result.content as { text: string }[])[0]!.text)).toEqual({
      error: 'Student limit reached',
      code: 'UPGRADE_REQUIRED',
      status: 403
    });
  });

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

  it.each([
    ['list_org_courses', true, false],
    ['get_course_structure', true, false],
    ['get_course_draft', true, false],
    ['update_course_landing_page', false, false],
    ['create_course_draft', false, false],
    ['create_course_draft_from_course', false, false],
    ['update_course_draft', false, false],
    ['tag_course_draft', false, true],
    ['publish_course_draft', false, true],
    ['publish_course_draft_to_existing_course', false, true],
    ['tag_courses', false, true]
  ])('annotates %s as readOnly=%s, destructive=%s', async (name, readOnlyHint, destructiveHint) => {
    const { tools } = await (await connect({ includeLocalFileTools: false })).listTools();

    expect(tools.find((tool) => tool.name === name)?.annotations).toMatchObject({ readOnlyHint, destructiveHint });
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

  it('lists courses through the public API and keeps the pagination', async () => {
    const requests: Request[] = [];
    const pagination = { page: 2, limit: 20, total: 21, totalPages: 2 };
    const apiClient = new ClassroomIoApiClient(
      {
        CLASSROOMIO_API_URL: 'https://api.example.com',
        CLASSROOMIO_API_KEY: 'token-1',
        CLASSROOMIO_USER_AGENT: 'agent'
      },
      {
        fetch: async (input, init) => {
          requests.push(new Request(input, init));

          return new Response(JSON.stringify({ success: true, data: [{ id: 'course-1' }], pagination }));
        }
      }
    );

    const result = await apiClient.listOrganizationCourses({ page: 2, search: 'safety' });

    expect(new URL(requests[0]!.url).pathname).toBe('/public-api/v1/courses');
    expect(new URL(requests[0]!.url).searchParams.get('search')).toBe('safety');
    expect(result).toEqual({ data: [{ id: 'course-1' }], pagination });
  });
});
