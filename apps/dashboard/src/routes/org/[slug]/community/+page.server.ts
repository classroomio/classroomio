import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { org } = await parent();

  if (!org?.id) {
    return {
      questions: []
    };
  }

  // Fetch community questions
  const questionsResponse = await classroomio.community.$get(
    { query: { orgId: org.id } },
    getApiHeaders(cookies, org.id)
  );

  const questionsData = await questionsResponse.json();
  const questions = questionsData.success ? questionsData.data : [];

  return {
    questions
  };
};
