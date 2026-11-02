import type * as z from 'zod';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  ZPublicApiAssignAudienceCoursesResponse,
  ZPublicApiAudienceMemberResponse,
  ZPublicApiCourseDetailResponse,
  ZPublicApiCourseListItemResponse,
  ZPublicApiCourseResponse,
  ZPublicApiCourseStructureResponse,
  ZPublicApiCreateCourseResponse,
  ZPublicApiRemoveAudienceMemberResponse,
  ZPublicApiUpdateCourseResponse,
  ZPublicApiUpdateCourseStructureResponse
} from '@cio/utils/validation/public-api';
import type {
  assignAudienceCoursesService,
  getAudienceMemberService,
  listAudienceService,
  removeAudienceService
} from '@api/services/v1/audience';
import type {
  createPublicApiCourseService,
  deletePublicApiCourseService,
  exportCourseService,
  getCourseService,
  listCoursesService,
  updatePublicApiCourseService,
  updatePublicApiCourseStructureService
} from '@api/services/v1/courses/course';

type Returned<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;
type KeysOf<T> = T extends unknown ? keyof T : never;
type DocumentedKeys<T extends z.ZodType> = keyof z.infer<T>;

// Checked by `tsc`, not at runtime: a service that gains or drops a top-level field fails the build until the documented response schema is updated.
describe('public API response schemas match what the services return', () => {
  it('audience', () => {
    expectTypeOf<KeysOf<Returned<typeof listAudienceService>['items'][number]>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiAudienceMemberResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof getAudienceMemberService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiAudienceMemberResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof assignAudienceCoursesService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiAssignAudienceCoursesResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof removeAudienceService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiRemoveAudienceMemberResponse>
    >();
  });

  it('courses', () => {
    expectTypeOf<KeysOf<Returned<typeof listCoursesService>['items'][number]>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiCourseListItemResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof getCourseService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiCourseDetailResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof createPublicApiCourseService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiCreateCourseResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof updatePublicApiCourseService>['course']>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiUpdateCourseResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof deletePublicApiCourseService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiCourseResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof exportCourseService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiCourseStructureResponse>
    >();
    expectTypeOf<KeysOf<Returned<typeof updatePublicApiCourseStructureService>>>().toEqualTypeOf<
      DocumentedKeys<typeof ZPublicApiUpdateCourseStructureResponse>
    >();
  });
});
