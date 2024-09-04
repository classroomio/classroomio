import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import {
  getConfigResponse,
  addDomainToVercel,
  removeDomainFromVercelProject
} from '$lib/utils/functions/domains';

const supabase = getSupabase();

export async function POST({ request }) {
  const { params } = await request.json();
  const accessToken = request.headers.get('Authorization');
  console.log('/GET api/domain/welcome', params);

  if (!params?.key || !accessToken) {
    return json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    return json({ success: false, message: 'Unauthenticated user' }, { status: 401 });
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
