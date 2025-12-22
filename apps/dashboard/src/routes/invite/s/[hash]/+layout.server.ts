import { OrgApiServer } from '$features/org/api/org.server';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params = { hash: '' } }) => {
  try {
    const courseHashData = atob(decodeURIComponent(params.hash));
    console.log('courseHashData', courseHashData);

    const { id, name, description, orgSiteName } = JSON.parse(courseHashData);

    if (!id || !name || !description || !orgSiteName) {
      throw 'Validation failed';
    }

    const currentOrg = await OrgApiServer.getOrgBySiteName(orgSiteName);

    return {
      id,
      name,
      description,
      currentOrg
    };
  } catch (error) {
    console.error('Error decoding course invite params.hash', error);
    redirect(307, '/404');
  }
};
