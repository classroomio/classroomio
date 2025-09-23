import { ProductInviteService } from '$lib/utils/services/products/invite';
import { supabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';

export const POST = async ({ params, request, fetch }) => {
  const { id } = params;
  const { profileId } = await request.json();

  console.log('id', id);
  console.log('profileId', profileId);
  const authorization = request.headers.get('authorization');

  const productInviteService = new ProductInviteService(supabase);
  const invite = await productInviteService.acceptInvite(id, profileId, {
    fetch,
    headers: {
      Authorization: authorization || ''
    }
  });

  console.log('invite', invite);

  if (!invite) {
    return json({ success: false });
  }

  return json({ success: true, invite });
};
