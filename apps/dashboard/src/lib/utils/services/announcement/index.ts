import type { Anouncements } from '$lib/utils/types/anouncement';
import type { Course } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';
import { STATUS } from '$lib/utils/constants/course';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export async function fetchAnnouncement() {
  // comments:course_announcement_comment(*)

  // courseId?: Course['id']

  //   const response: any = await supabase
  //     .from('course_announcement')
  //     .select(
  //       `
  // id,
  // created_at,
  // image,
  // content,
  // author,
  // emoji,

  // `
  //     )
  //     .match({ id: courseId });
  const response: any = await supabase.from('course_announcement').select('*');

  const { data, error } = response;

  console.log(`error`, error);
  console.log(`data`, data);
  if (!data || error) {
    console.log(`data`, data);
    console.log(`fetchCourse => error`, error);
    // return this.redirect(307, '/courses');
    return { data, error };
  }

  return { data, error };
}

export async function createAnnouncement(announcement: Anouncements) {
  console.log(announcement);
  const response = await supabase.from('course_announcement').insert({
    image: announcement.image,
    content: announcement.content,
    author: announcement.author,
    // comments: [],
    emoji: announcement.emoji
  });

  console.log('create', response);

  return { response };
}
