import type { Announcement } from '$lib/utils/types/anouncement';
import type { Course } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';
import { STATUS } from '$lib/utils/constants/course';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export async function fetchAnnouncement(courseId?: Course['id']) {
  const response: any = await supabase
    .from('course_newsfeed')
    .select(
      `
    id,
    created_at,
    content,
    course_id,
    author_id,
    reaction,
    comment:course_newsfeed_comment(id,
        created_at,
        author_id,
        content,
        course_newsfeed_id)
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
    return { data, error };
  }

  return { data, error };
}

export async function createAnnouncement(announcement: {
  content: string;
  author_id: string;
  course_id: string;
  reaction: any;
}) {
  console.log(announcement);
  const response = await supabase
    .from('course_newsfeed')
    .insert({
      content: announcement.content,
      author_id: announcement.author_id,
      course_id: announcement.course_id,
      reaction: announcement.reaction
    })
    .select();

  console.log('create', response);

  return { response };
}

export async function createComment(comment: {
  content: string;
  author_id: string;
  course_newsfeed_id: string;
}) {
  const response = await supabase
    .from('course_newsfeed_comment')
    .insert({
      content: comment.content,
      author_id: comment.author_id,
      course_newsfeed_id: comment.course_newsfeed_id
    })
    .select();

  console.log('create', response);

  return { response };
}

export async function deleteNewsFeedComment(commentId: string) {
  const response = await supabase.from('course_newsfeed_comment').delete().match({ id: commentId });
  console.log('deletecomment', response);
  return response;
}
export async function deleteNewsFeed(feedId: string) {
  await supabase.from('course_newsfeed_comment').delete().match({ course_newsfeed_id: feedId });
  const response = await supabase.from('course_newsfeed').delete().match({ id: feedId });
  console.log('deleteFeed', response);
  return response;
}
