import { describe, expect, it, vi } from 'vitest';
import { Hono } from '@api/utils/hono';

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope))
}));

vi.mock('@api/services/v1/courses/course', () => ({
  clonePublicApiCourseService: vi.fn(),
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  listRelatedCoursesService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

import { generateSpecs } from 'hono-openapi';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1CourseRouter } from '@api/routes/v1/courses/course';

describe('v1CourseRouter OpenAPI security', () => {
  it('advertises only the bearer API key for creating a course', async () => {
    // POST /courses requires public_api:*, which OAuth tokens can never carry.
    const app = new Hono().route('/public-api/v1/courses', v1CourseRouter);
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { security?: unknown[] }>>;
    };

    expect(spec.paths['/public-api/v1/courses']?.post?.security).toEqual([{ bearerAuth: [] }]);
  });
});
