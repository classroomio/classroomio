import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type GetPublicCourseRequest = (typeof classroomio)['org-site']['course'][':courseSlug']['$get'];
type GetPublicCourseSuccess = Extract<InferResponseType<GetPublicCourseRequest>, { success: true }>;

export const load = async ({ params = { slug: '' } }) => {
  const treeResult = await safeServerApi<GetPublicCourseSuccess>(() =>
    classroomio['org-site'].course[':courseSlug'].$get({ param: { courseSlug: params.slug } }, getApiKeyHeaders())
  );

  if (!treeResult.ok) {
    throw error(404, 'Public course not found');
  }

  return {
    tree: treeResult.body.data
  };
};
