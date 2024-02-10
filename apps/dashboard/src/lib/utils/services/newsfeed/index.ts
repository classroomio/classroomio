import type { Course } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';

export async function fetchNewsFeeds(courseId?: Course['id']) {
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
    comment:course_newsfeed_comment(
        id,
        created_at,
        author_id,
        content,
        course_newsfeed_id)
    `
    )
    .match({ course_id: courseId })
    .order('created_at', { ascending: false });

  const { data, error } = response;

  return { data, error };
}

export async function createNewFeed(post: {
  content: string;
  author_id: string;
  course_id: string;
  reaction: any;
}) {
  const response = await supabase
    .from('course_newsfeed')
    .insert({
      content: post.content,
      author_id: post.author_id,
      course_id: post.course_id,
      reaction: post.reaction
    })
    .select();

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

  return { response };
}

export async function deleteNewsFeedComment(commentId: string) {
  const response = await supabase.from('course_newsfeed_comment').delete().match({ id: commentId });

  return response;
}
export async function deleteNewsFeed(feedId: string) {
  await supabase.from('course_newsfeed_comment').delete().match({ course_newsfeed_id: feedId });
  const response = await supabase.from('course_newsfeed').delete().match({ id: feedId });

  return response;
}
