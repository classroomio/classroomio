import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { org } = await parent();
  const slug = params.slug || '';

  // Fetch community question by slug
  const questionResponse = await classroomio.community[':slug'].$get(
    { param: { slug } },
    getApiHeaders(cookies, org?.id)
  );

  const questionData = await questionResponse.json();
  const question = questionData.success ? questionData.data : null;

  return {
    slug,
    question
  };
};
