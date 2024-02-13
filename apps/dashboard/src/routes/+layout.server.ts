import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
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
  org: CurrentOrg | null;
}

export const load = async ({ url, cookies }): Promise<LoadOutput> => {
  const response: LoadOutput = {
    orgSiteName: '',
    isOrgSite: false,
    skipAuth: false,
    org: null
  };

  const _orgSiteName = cookies.get('_orgSiteName');
  const debugPlay = cookies.get('debugPlay');
  const debugMode = _orgSiteName && _orgSiteName !== 'false';

  const matches = url.host.match(/([a-z 0-9 -]+).*classroomio[.]com/);
  const subdomain = matches?.[1] ?? '';

  if (!url.host.includes('.classroomio.com') && !url.host.includes('localhost')) {
    // TODO: We can verify if custom domain here
    return response;
  }

  if (!blockedSubdomain.includes(subdomain)) {
    const answer = Array.isArray(matches) ? !!subdomain && subdomain !== 'www' : false;

    response.isOrgSite = debugMode || answer;
    response.orgSiteName = debugMode ? _orgSiteName : subdomain;
    response.org = (await getCurrentOrg(response.orgSiteName, true)) || null;
    

    if (!response.org && !dev) {
      throw redirect(307, 'https://app.classroomio.com/404?type=org');
    }
  } else if (subdomain === 'play' || debugPlay === 'true') {
    response.skipAuth = true;
  } else if (subdomain !== 'app' && !dev) {
    throw redirect(307, 'https://app.classroomio.com');
  }

  return response;
};
