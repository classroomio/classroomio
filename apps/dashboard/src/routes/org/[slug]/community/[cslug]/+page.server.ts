import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const slug = params.cslug || '';

  const questionResponse = await classroomio.community[':slug'].$get(
    { param: { slug } },
    getApiHeaders(cookies, orgId)
  );

  const questionData = await questionResponse.json();
  const question = questionData.success ? questionData.data : null;

  return {
    slug,
    question
  };
};
