import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClassroomIoApiClient } from '../src/api-client';
import { registerLearningPathTools } from '../src/tools/learning-paths';

const API_URL = 'https://api.test';
const PATH_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function createClient() {
  return new ClassroomIoApiClient({
    CLASSROOMIO_API_URL: API_URL,
    CLASSROOMIO_API_KEY: 'key-1',
    CLASSROOMIO_USER_AGENT: 'test'
  } as never);
}

type RegisteredTool = {
  annotations: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

function registerTools(apiClient: ClassroomIoApiClient) {
  const tools = new Map<string, RegisteredTool>();
  const server = {
    tool: (
      name: string,
      _description: string,
      _shape: unknown,
      annotations: Record<string, unknown>,
      handler: RegisteredTool['handler']
    ) => {
      tools.set(name, { annotations, handler });
    }
  };

  registerLearningPathTools(server as never, apiClient);

  return tools;
}

describe('ClassroomIoApiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listOrgLearningPaths keeps pagination next to data', async () => {
    const pagination = { page: 2, limit: 10, total: 11, totalPages: 2 };
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ id: PATH_ID }], pagination }));

    const result = await createClient().listOrgLearningPaths({ page: 2, limit: 10, search: 'react' });

    expect(result).toEqual({ data: [{ id: PATH_ID }], pagination });
    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.pathname).toBe('/learning-path');
    expect(Object.fromEntries(requestedUrl.searchParams)).toEqual({ page: '2', limit: '10', search: 'react' });
  });

  it('listOrganizationCourses still returns the data array, not the envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: [{ id: COURSE_ID }], pagination: { page: 1, total: 1 } })
    );

    const result = await createClient().listOrganizationCourses({} as never);

    expect(result).toEqual([{ id: COURSE_ID }]);
  });

  it('encodes path and course ids into separate URL segments', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await createClient().removeLearningPathCourse('a b', 'c/d');

    expect(String(fetchMock.mock.calls[0][0])).toBe(`${API_URL}/learning-path/a%20b/courses/c%2Fd`);
  });

  it('surfaces API errors with status, code and field', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: 'Nope', code: 'VALIDATION_ERROR', field: 'cost' }, 400)
    );

    await expect(createClient().getLearningPath(PATH_ID)).rejects.toMatchObject({
      message: 'Nope',
      status: 400,
      code: 'VALIDATION_ERROR',
      field: 'cost'
    });
  });
});

describe('learning path tools', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(jsonResponse({ success: true, data: {} }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('every tool declares the expected annotation', () => {
    const tools = registerTools(createClient());

    expect(Object.fromEntries([...tools].map(([name, tool]) => [name, tool.annotations]))).toEqual({
      list_org_learning_paths: { readOnlyHint: true },
      get_learning_path: { readOnlyHint: true },
      create_learning_path: { readOnlyHint: false, destructiveHint: false },
      add_learning_path_courses: { readOnlyHint: false, destructiveHint: false },
      update_learning_path_landing_page: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      reorder_learning_path_courses: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      remove_learning_path_course: { readOnlyHint: false, destructiveHint: true }
    });
  });

  it.each(['../organization/courses', 'abc?x=1', 'abc#frag', 'short'])(
    'rejects malformed path id %s before any request',
    async (pathId) => {
      const tools = registerTools(createClient());

      await expect(tools.get('get_learning_path')!.handler({ pathId })).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each([PATH_ID, 'AbCd1234'])('accepts a UUID or 8-character public id (%s)', async (pathId) => {
    const tools = registerTools(createClient());

    await tools.get('get_learning_path')!.handler({ pathId });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('list_org_learning_paths returns data with pagination as JSON text', async () => {
    const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ id: PATH_ID }], pagination }));
    const tools = registerTools(createClient());

    const result = await tools.get('list_org_learning_paths')!.handler({});

    expect(JSON.parse(result.content[0].text)).toEqual({ data: [{ id: PATH_ID }], pagination });
  });
});
