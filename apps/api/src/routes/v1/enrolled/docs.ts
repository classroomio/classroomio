/** OpenAPI response schemas for these routes, from the shared public contracts. */
import { resolver, type ResolverReturnType } from 'hono-openapi';

import { ZPublicApiEnrolledListResponse } from '@cio/utils/validation/public-api';

/** Concrete contract: enrolled items as a kind-discriminated union. */
export const EnrolledListResponseSchema: ResolverReturnType = resolver(ZPublicApiEnrolledListResponse);
