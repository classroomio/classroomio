import { redirect } from '@sveltejs/kit';
import { getCurrentOrg } from '$lib/utils/services/org';
import { supabase } from '$lib/utils/functions/supabase.server';
import { ProductInviteService } from '$lib/utils/services/products/invite.js';
import { getProfile } from '$lib/utils/functions/user';

export const load = async ({ params = { id: '' } }) => {
  try {
    const productInviteService = new ProductInviteService(supabase);

    const invite = await productInviteService.getInvite(params.id);

    if (!invite || !invite.organization) {
      throw redirect(307, '/404');
    }

    const response = await Promise.all([
      getCurrentOrg(invite.organization.siteName, true),
      getProfile(invite.email)
    ]);

    const org = response[0];
    const profile = response[1];

    if (!org) {
      console.error('Org not found', org);
      throw new Error('Org not found');
    }

    return {
      invite,
      org,
      profile
    };
  } catch (error) {
    console.error('Error decoding invite params.hash', error);
    throw error;
  }
};
