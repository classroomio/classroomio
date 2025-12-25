import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { org } = await parent();
  const siteName = params.slug || '';

  // Fetch setup progress
  const setupResponse = await classroomio.organization.setup.$get(
    { query: { siteName } },
    getApiHeaders(cookies, org?.id)
  );

  const setupData = await setupResponse.json();
  console.log('setupData', setupData);
  const setupProgress = setupData.success ? setupData.data : null;

  return {
    orgSiteName: siteName,
    setupProgress
  };
};
