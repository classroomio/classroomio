import { redirect, json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';

export const GET = async ({ url }) => {
  const supabase = getServerSupabase();

  const data = url.searchParams.get('data');
  if (!data) return json({ message: 'data is not found' }, { status: 404 });

  const hashData = decodeURIComponent(data);
  console.log('hashData', hashData);

  const decodedData = atob(hashData);
  console.log('decodedData', decodedData);

  const { profileId, orgSiteName } = JSON.parse(decodedData);

  const { error } = await supabase
    .from('profile')
    .update({ is_email_verified: true, verified_at: new Date().toDateString() })
    .match({ id: profileId });

  if (error) {
    console.log('profile not found', error);
    throw redirect(307, '/404');
  }

  throw redirect(307, `/org/${orgSiteName}?welcomePopup=true`);
};
