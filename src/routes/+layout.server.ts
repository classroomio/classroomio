// import { redirect } from '@sveltejs/kit';
import { blockedSubdomain } from '$lib/utils/constants/app';
import { getCurrentOrg } from '$lib/utils/services/org';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import type { CurrentOrg } from '$lib/utils/types/org';

if (!supabase) {
  getSupabase();
}

interface LoadOutput {
  orgSiteName: string;
  isOrgSite: boolean;
  skipAuth: boolean;
  org: CurrentOrg;
}

export const load = async ({ url, cookies }): Promise<LoadOutput> => {
  // if (url.hostname === 'classroomio.com') {
  //   throw redirect(301, 'https://about.classroomio.com');
  // }

  let response: LoadOutput = {
    orgSiteName: '',
    isOrgSite: false,
    skipAuth: false,
    org: {
      theme: ''
    }
  };

  const _orgSiteName = cookies.get('_orgSiteName');
  const debugPlay = cookies.get('debugPlay');
  const debugMode = _orgSiteName && _orgSiteName !== 'false';
  console.log('_orgSiteName', _orgSiteName);

  const matches = url.host.match(/([a-z 0-9 \-]+).*classroomio[.]com/);
  const subdomain = matches?.[1] ?? '';

  if (!blockedSubdomain.includes(subdomain)) {
    const answer = Array.isArray(matches) ? !!subdomain && subdomain !== 'www' : false;

    response.isOrgSite = debugMode || answer;
    response.orgSiteName = debugMode ? _orgSiteName : subdomain;
    response.org = await getCurrentOrg(response.orgSiteName, true);
  } else if (subdomain === 'play' || debugPlay === 'true') {
    response.skipAuth = true;
  }

  return response;
};
