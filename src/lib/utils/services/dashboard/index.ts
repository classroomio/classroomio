import type { UserLessonDataType } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';

export async function fetchUserUpcomingData(
  profileId: string | null
): Promise<UserLessonDataType[] | []> {
  if (!profileId) {
    return [];
  }

  const { data: userUpcomingData } = await supabase.rpc(
    'get_user_upcoming_lessons',
    {
      profile_id_arg: profileId,
    }
  );

  console.log(`userUpcomingData`, userUpcomingData);

  if (!Array.isArray(userUpcomingData)) {
    return [];
  }

  return userUpcomingData;
}
