import { getServerSupabase } from '$lib/utils/functions/supabase.server';

const supabase = getServerSupabase();

export const validateUser = async (accessToken: string) => {
  let user;

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
};
