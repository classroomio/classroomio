import { User } from '@supabase/supabase-js';
import { getSupabase } from '../supabase';

const supabase = getSupabase();

export async function validateUser(accessToken: string): Promise<User> {
  let user: User | null = null;

  try {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    throw new Error('Unauthenticated user');
  }

  return user;
}
