import { useMutation, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { previewReactionToggle } from '@/feature/newsfeed/helpers/reactions';
import { useNewsfeedKeys } from '@/feature/newsfeed/helpers/use-newsfeed-keys';
import type { NewsfeedPost, NewsfeedViewer, ReactionType } from '@/feature/newsfeed/types/newsfeed';

import type { NewsfeedPages } from './newsfeed-posts';

type Reaction = NewsfeedPost['reaction'];

function withReaction(pages: NewsfeedPages | undefined, postId: string, reaction: Reaction) {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((post) => (post.id === postId ? { ...post, reaction } : post))
    }))
  };
}

/** Sets or clears the user's reaction, showing the change immediately and rolling back if the server rejects it. */
export function useToggleReactionMutation(courseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);

  const write = (postId: string, reaction: Reaction) => {
    queryClient.setQueryData<NewsfeedPages>(keys.posts, (current) => withReaction(current, postId, reaction));
    queryClient.setQueryData<NewsfeedPost>(keys.post(postId), (current) =>
      current ? { ...current, reaction } : current
    );
  };

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: ReactionType; previous: Reaction }) => {
      const response = await request(
        api.course[':courseId']['newsfeed-viewer'][':feedId'].reaction.$put({
          param: { courseId, feedId: postId },
          json: { type }
        })
      );

      return response.data;
    },
    onMutate: async ({ postId, type, previous }) => {
      await queryClient.cancelQueries({ queryKey: keys.posts });
      const groupMemberId = queryClient.getQueryData<NewsfeedViewer>(keys.viewer)?.groupMemberId;
      if (groupMemberId) write(postId, previewReactionToggle(previous, groupMemberId, type));
    },
    onError: (_error, { postId, previous }) => write(postId, previous),
    onSuccess: (result, { postId }) => {
      write(postId, result.reaction);
      queryClient.setQueryData<NewsfeedViewer>(keys.viewer, (current) =>
        current && !current.groupMemberId ? { ...current, groupMemberId: result.groupMemberId } : current
      );
    }
  });
}
