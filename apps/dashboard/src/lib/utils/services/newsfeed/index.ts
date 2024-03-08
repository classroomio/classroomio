import type { Course } from '$lib/utils/types';
import { supabase } from '$lib/utils/functions/supabase';
import type { Reaction, FeedApi, Feed } from '$lib/utils/types/feed';

export async function fetchNewsFeedReaction(feedId: Feed['id']) {
  return supabase.from('course_newsfeed').select(`reaction`).eq('id', feedId).single();
}

export async function fetchNewsFeeds(courseId?: Course['id']) {
  const response = await supabase
    .from('course_newsfeed')
    .select(
      `
    id,
    created_at,
    content,
    course_id,
    author:groupmember(
      profile(
        id,
        fullname,
        avatar_url
      )
    ),
    reaction,
    is_pinned,
    comment:course_newsfeed_comment(
        id,
        created_at,
        author:groupmember( profile(id, fullname, avatar_url) ),
        content,
        course_newsfeed_id)
    `
    )
    .match({ course_id: courseId })
    .order('created_at', { ascending: false })
    .returns<FeedApi[]>();

  const { data, error } = response;

  return { data, error };
}

export async function createNewFeed(post: {
  content: string;
  author_id: string;
  course_id: string;
  reaction: Reaction;
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

export async function handleEditFeed(feedId: string, content: string) {
  const response = await supabase
    .from('course_newsfeed')
    .update({ content: content })
    .match({ id: feedId })
    .select();
  return response;
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

export async function toggleFeedIsPinned(feedId: string, isPinned: boolean) {
  const response = await supabase
    .from('course_newsfeed')
    .update({
      is_pinned: isPinned
    })
    .match({ id: feedId });

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

export async function getFeedForNotification(feedId: string, authorId: string) {
  const { data, error } = await supabase
    .from('course_newsfeed')
    .select(
      `
    content,
    author:groupmember(profile(fullname, email)),
    course(
      id,
      title,
      group(
        organization(siteName, name),
        members:groupmember(id, profile(email, fullname))
      )
    )
  `
    )
    .eq('id', feedId)
    .limit(1)
    .returns<
      {
        content: string;
        author: {
          profile: {
            email: string;
            fullname: string;
          };
        };
        course: {
          id: string;
          title: string;
          group: {
            organization: {
              name: string;
              siteName: string;
            };
            members: {
              id: string;
              profile: {
                email: string;
                fullname: string;
              };
            }[];
          };
        };
      }[]
    >();

  if (error) {
    console.error('Failed to get feed', error);
    return null;
  }
  console.log({
    data
  });
  const [feed] = data || [];

  if (!feed) return;

  return {
    id: feedId,
    courseId: feed.course.id,
    courseTitle: feed.course.title,
    teacherName: feed.author?.profile?.fullname,
    teacherEmail: feed.author?.profile?.email,
    content: feed.content,
    org: feed.course.group?.organization,
    courseMembers: feed.course?.group?.members
      ?.filter((member) => member.id !== authorId)
      ?.map((member) => {
        return member.profile;
      })
  };
}
