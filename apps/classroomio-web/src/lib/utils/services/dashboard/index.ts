import type { UserLessonDataType } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';

function getFirstAndLastDayOfMonth(): { firstDay: string; lastDay: string } {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  // Create a date object for the first day of the month
  const firstDay = new Date(year, month, 1).toISOString();

  // Find the last day of the next month and subtract one day to get the last day of the current month
  const nextMonth: any = new Date(year, month + 1, 1);
  const lastDay = new Date(nextMonth - 1).toISOString();

  return {
    firstDay,
    lastDay
  };
}

export async function fetchUserUpcomingData(
  profileId: string | null,
  orgId: string
): Promise<UserLessonDataType[] | []> {
  if (!profileId) {
    return [];
  }

  const { lastDay, firstDay } = getFirstAndLastDayOfMonth();

  const { data: userUpcomingData } = await supabase
    .rpc('get_user_upcoming_lessons', {
      profile_id_arg: profileId,
      org_id_arg: orgId
    })
    .filter('lesson_at', 'gte', firstDay)
    .filter('lesson_at', 'lte', lastDay);

  console.log(`userUpcomingData`, userUpcomingData);

  if (!Array.isArray(userUpcomingData)) {
    return [];
  }

  return userUpcomingData;
}
