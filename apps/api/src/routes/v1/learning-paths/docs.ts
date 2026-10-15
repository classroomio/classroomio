/** OpenAPI response schemas for these routes, from the shared public contracts. */
import { resolver, type ResolverReturnType } from 'hono-openapi';

import {
  ZPublicApiLearningPathDetailResponse,
  ZPublicApiLearningPathListResponse,
  ZPublicApiLearningPathResponse,
  ZPublicApiPathCourseLinkResponse,
  ZPublicApiPathCourseLinksResponse,
  ZPublicApiPathMembersResponse,
  ZPublicApiReorderPathCoursesResponse
} from '@cio/utils/validation/public-api';

/** Concrete contract: path list rows. */
export const LearningPathsListResponseSchema: ResolverReturnType = resolver(ZPublicApiLearningPathListResponse);

/** Concrete contract: single path row (create, update, delete). */
export const LearningPathResponseSchema: ResolverReturnType = resolver(ZPublicApiLearningPathResponse);

/** Concrete contract: path detail with ordered courses. */
export const LearningPathDetailResponseSchema: ResolverReturnType = resolver(ZPublicApiLearningPathDetailResponse);

/** Concrete contract: paginated path members. */
export const PathMembersResponseSchema: ResolverReturnType = resolver(ZPublicApiPathMembersResponse);

/** Concrete contract: the path-course link rows written by an add. */
export const PathCoursesResponseSchema: ResolverReturnType = resolver(ZPublicApiPathCourseLinksResponse);

/** Concrete contract: the path-course link row a removal soft-deletes. */
export const PathCourseResponseSchema: ResolverReturnType = resolver(ZPublicApiPathCourseLinkResponse);

/** Concrete contract: path course reorder acknowledgment. */
export const ReorderPathCoursesResponseSchema: ResolverReturnType = resolver(ZPublicApiReorderPathCoursesResponse);
