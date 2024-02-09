import type { Announcement } from '$lib/utils/types/anouncement';
import type { Course } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';
import { STATUS } from '$lib/utils/constants/course';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export async function fetchAnnouncement(courseId?: Course['id']) {
  const response: any = await supabase
    .from('course_announcement')
    .select(
      `
    id,
    created_at,
    content,
    course_id,
    author_id,
    comment:course_announcement_comment(id,
        created_at,
        author_id,
        content,
        course_announcement_id)
    `
    )
    .match({ course_id: courseId })
    .order('created_at', { ascending: false });
  //   const response: any = await supabase.from('course_announcement').select('*');

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

export async function createAnnouncement(announcement: {
  content: string;
  author_id: string;
  course_id: string;
}) {
  console.log(announcement);
  const response = await supabase
    .from('course_announcement')
    .insert({
      content: announcement.content,
      author_id: announcement.author_id,
      course_id: announcement.course_id
    })
    .select();

  console.log('create', response);

  return { response };
}

export async function createComment(comment: {
  content: string;
  author_id: string;
  course_announcement_id: string;
}) {
  const response = await supabase
    .from('course_announcement_comment')
    .insert({
      content: comment.content,
      author_id: comment.author_id,
      course_announcement_id: comment.course_announcement_id
    })
    .select();

  console.log('create', response);

  return { response };
}

export async function createReaction(
  reaction: string,
  author_id: string,
  course_announcement_id: string
) {
  const response = await supabase
    .from('course_announcement_reaction')
    .insert({
      reaction: reaction,
      selected_by: author_id,
      course_announcement_id: course_announcement_id
    })
    .select();

  console.log('create', response);

  return { response };
}

export async function deleteReaction(reactionId: string) {
  const response = await supabase
    .from('course_announcement_reaction')
    .delete()
    .match({ id: reactionId });
  console.log('deleteReaction', reactionId, response);
  return response;
}
export async function deleteNewsFeed(announcementId: string) {
  const response = await supabase
    .from('course_announcement')
    .delete()
    .match({ id: announcementId });
  console.log('deleteAnnoucement', response);
  return response;
}

export async function deleteNewsFeedComment(commentId: string) {
  const response = await supabase
    .from('course_announcement_comment')
    .delete()
    .match({ id: commentId });
  console.log('deletecomment', response);
  return response;
}
