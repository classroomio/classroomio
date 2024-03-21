import { redirect, json } from '@sveltejs/kit';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';

export const GET = async ({ url }) => {
  if (!supabase) {
    await getSupabase();
  }

  const data = url.searchParams.get('data');
  if (!data) return json({ message: 'data is not found' }, { status: 404 });
  try {
    const hashData = decodeURIComponent(data);
    console.log('hashData', hashData);

    const decodedData = atob(hashData);
    console.log('decodedData', decodedData);

    const { profileId, orgSiteName } = JSON.parse(decodedData);

    const { data: updatedProfileData, error } = await supabase
      .from('profile')
      .update({ is_email_verified: true, verified_at: new Date().toDateString() })
      .eq('id', profileId)
      .select();

    if (error) {
      console.log('profile not found');
      throw redirect(307, '/404');
    }

    console.log('updatedProfileData', updatedProfileData);
    console.log('profile data', profileId);

    return json(null, {
      status: 302,
      headers: {
        Location: `/org/${orgSiteName}`
      }
    });
  } catch (error) {
    console.error('Error decoding inviteLink', error);
    throw redirect(307, '/404');
  }
};
