import type { InferResponseType } from '$lib/utils/services/api';
import { classroomio } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { isPathPaid } from '@cio/utils/validation/learning-path';
import { error } from '@sveltejs/kit';
import type { GetPublicLearningPathRequest } from '$features/learning-path/utils/types';

type GetPublicLearningPathSuccess = Extract<InferResponseType<GetPublicLearningPathRequest>, { success: true }>;

export const load = async ({ params, parent }) => {
  const slug = params?.slug ?? '';

  if (!slug) {
    throw error(404, 'Not found');
  }

  const { isOrgSite, org } = await parent();

  if (!isOrgSite || !org?.id) {
    throw error(404, 'Not found');
  }

  const pathResult = await safeServerApi<GetPublicLearningPathSuccess>(() =>
    classroomio['learning-path'].public[':slug'].$get({
      param: { slug },
      query: { organizationId: org.id }
    })
  );

  if (!pathResult.ok || !pathResult.body.data) {
    throw error(404, 'Not found');
  }

  const pathData = pathResult.body.data;
  const cost = pathData.cost ?? 0;
  const landing = (pathData.landingPage ?? {}) as { title?: string; description?: string };

  const path = {
    id: pathData.id,
    publicId: pathData.publicId ?? pathData.id,
    slug,
    name: landing.title || pathData.name,
    description: landing.description || pathData.description || '',
    cost,
    allowSelfEnrollment: pathData.selfEnrollment !== false,
    status: pathData.status,
    isPublished: pathData.isPublished ?? true
  };

  const currentOrg = {
    id: org.id,
    name: org.name,
    siteName: org.siteName ?? '',
    theme: typeof org.theme === 'string' ? org.theme : undefined
  };

  return {
    path,
    currentOrg,
    requiresPaymentOrInvite: isPathPaid(cost, pathData.landingPage)
  };
};
