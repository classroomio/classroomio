import type { CommunityQuestionsSuccess } from '$features/community/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      questions: []
    };
  }

  const result = await safeServerApi<CommunityQuestionsSuccess>(() =>
    classroomio.community.$get({ query: { orgId } }, getApiHeaders(cookies, orgId))
  );
  const questions = result.ok ? result.body.data : [];

  return {
    questions,
    orgId
  };
};
