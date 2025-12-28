import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      questions: []
    };
  }

  // Fetch community questions
  const questionsResponse = await classroomio.community.$get({ query: { orgId } }, getApiHeaders(cookies, orgId));

  const questionsData = await questionsResponse.json();
  const questions = questionsData.success ? questionsData.data : [];

  return {
    questions,
    orgId
  };
};
