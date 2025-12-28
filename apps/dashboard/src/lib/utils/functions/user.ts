import { supabase } from '$lib/utils/functions/supabase';
import type { Profile } from '$features/course/components/People/types';

export async function getProfile(email: string): Promise<Profile | null> {
  const { data } = await supabase.from('profile').select('*').eq('email', email).single();
  console.log('getProfile data', data);
  return data;
}
