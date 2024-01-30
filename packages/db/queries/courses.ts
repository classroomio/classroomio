import { getSupabase } from 'utils/supabase';
import type { Course } from 'types';

// export async function fetchCourse(){}

export async function fetchCourse(courseId?: Course['id'], slug?: Course['slug']) {
  let match: { slug?: string; id?: string; status?: string } = {};

  if (slug) {
    match.slug = slug;
  } else {
    match.id = courseId;
  }

  match.status = STATUS[STATUS.ACTIVE];

  const response: PostgrestSingleResponse<Course | null> = await supabase
    .from('course')
    .select(
      `
      id,
      title,
      description,
      overview,
      logo,
      is_published,
      group(*,
        members:groupmember(*,
          profile(*)
        )
      ),
      slug,
      cost,
      currency,
      metadata,
      is_certificate_downloadable,
      certificate_theme,
      lessons:lesson(
        id, title,public, lesson_at, call_url, is_unlocked, order, created_at,
        note, videos, slide_url, call_url, totalExercises:exercise(count), totalComments:lesson_comment(count),
        profile:teacher_id(id, avatar_url, fullname),
        lesson_completion(id, profile_id, is_complete)
      ),
      attendance:group_attendance(*),
      polls:apps_poll(status)
    `
    )
    .match(match)
    .single();

  const { data, error } = response;

  console.log(`error`, error);
  if (!data || error) {
    console.log(`data`, data);
    console.log(`fetchCourse => error`, error);
    // return this.redirect(307, '/courses');
    return { data, error };
  }

  return {
    data,
    error
  };
}
