import { redirect } from '@sveltejs/kit';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { isOrgChooserAvailable } from '$features/app/utils/post-auth-destination';

export const load = async ({ parent }) => {
  const { isOrgSite } = await parent();
  const isAvailable = isOrgChooserAvailable({ isCloud: PUBLIC_IS_SELFHOSTED !== 'true', isOrgSite: !!isOrgSite });

  if (!isAvailable) {
    redirect(307, '/');
  }

  return {};
};
