import {
  addDomainToVercel,
  getConfigResponse,
  removeDomainFromVercelProject
} from '$lib/utils/services/org/domain';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { params } = await request.json();
  console.log('/GET api/domain', params);

  if (!params?.key) {
    return json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  if (params?.domain?.includes('classroomio')) {
    return json({ success: false, message: 'Domain cannot contain classroomio' }, { status: 400 });
  }

  try {
    switch (params.key) {
      case 'verify_domain': {
        const configResponse = await getConfigResponse(params.domain);

        return json({ success: true, verified: !configResponse.misconfigured }, { status: 200 });
      }
      case 'add_domain': {
        const addDomainResponse = await addDomainToVercel(params.domain);
        return json({ success: true, data: addDomainResponse }, { status: 200 });
      }
      case 'remove_domain': {
        const removeDomainResponse = await removeDomainFromVercelProject(params.domain);
        return json({ success: true, data: removeDomainResponse }, { status: 200 });
      }
      default:
        return json({ success: false, message: 'Invalid key' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
