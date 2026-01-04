<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { NewsFeedLoader, NewsFeedCard, NewFeedModal } from '$features/course/components/newsfeed';
  import { courseApi } from '$features/course/api';
  import { RoleBasedSecurity } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { newsfeedApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { Feed } from '$features/course/utils/types';
  import PinIcon from '@lucide/svelte/icons/pin';
  import { onMount } from 'svelte';
  import type { AccountOrg } from '$features/app/types';
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { BookIcon } from '@lucide/svelte';
  import type { TNewsfeedReactionUpdate } from '@cio/utils/validation/newsfeed';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  let edit = $state(false);
  let editFeed: Feed | null = $state(null);

  let query = new URLSearchParams(page.url.search);
  let feedId = query.get('feedId') || '';

  const author = $derived.by(() => {
    return {
      id: courseApi.group.memberId || '',
      username: $profile.username || '',
      fullname: $profile.fullname || '',
      avatarUrl: $profile.avatarUrl || ''
    };
  });

  const deleteComment = async (feedId: string, commentId: string) => {
    await newsfeedApi.deleteComment(courseId, feedId, commentId);
  };

  const addNewReaction = async (reactionType: string, feedId: string, authorId: string) => {
    const reactedFeed = newsfeedApi.feeds.find((feed) => feed.id === feedId);
    if (!reactedFeed) return;

    const reaction = (reactedFeed as any).reaction || {};
    let reactedAuthorIds: string[] = reaction[reactionType] || [];

    if (reactedAuthorIds.includes(authorId)) {
      reactedAuthorIds = reactedAuthorIds.filter((reactionAuthorId) => reactionAuthorId !== authorId);
    } else {
      reactedAuthorIds = [...reactedAuthorIds, authorId];
    }

    const updatedReaction: TNewsfeedReactionUpdate['reaction'] = {
      ...reaction,
      [reactionType]: reactedAuthorIds
    };

    await newsfeedApi.react(courseId, feedId, updatedReaction);

    if (!newsfeedApi.success) {
      snackbar.error('snackbar.course.error.reaction_error');
    }
  };

  const addNewComment = async (comment: string, feedId: string) => {
    await newsfeedApi.createComment(courseId, feedId, comment, author);

    if (!newsfeedApi.success) {
      return snackbar.error('snackbar.course.error.commenting_error');
    }
  };

  const onPin = async (feedId: string, isPinned: boolean) => {
    const newIsPinned = !isPinned;
    await newsfeedApi.update(courseId, feedId, { isPinned: newIsPinned });

    if (!newsfeedApi.success) {
      return snackbar.error('snackbar.course.error.toggle_error');
    }

    snackbar.success(
      `${
        newIsPinned ? 'snackbar.course.success.pinned' : 'snackbar.course.success.unpinned'
      } snackbar.course.success.successfully`
    );
  };

  const deleteFeed = async (id: string) => {
    await newsfeedApi.delete(courseId, id);
  };

  const sortedFeeds = $derived.by(() => {
    return [...newsfeedApi.feeds].sort((a, b) => {
      const aPinned = (a as any).isPinned || (a as any).is_pinned || false;
      const bPinned = (b as any).isPinned || (b as any).is_pinned || false;
      return Number(bPinned) - Number(aPinned);
    });
  });

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }

  onMount(() => {
    newsfeedApi.list(courseId);
  });
</script>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(`/courses/${courseId}/lessons?next=true`);
  }}
>
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <NewFeedModal {courseId} bind:edit bind:editFeed />
  </RoleBasedSecurity>
  {#if newsfeedApi.isLoading}
    <div class="flex w-full flex-col items-center">
      <NewsFeedLoader />
      <NewsFeedLoader />
      <NewsFeedLoader />
    </div>
  {:else if !sortedFeeds.length}
    <Empty
      title={$t('course.navItem.news_feed.body_header')}
      description={$t('course.navItem.news_feed.body_content')}
      icon={BookIcon}
    />
  {:else}
    {#each sortedFeeds as feed}
      {#if (feed as any).isPinned || (feed as any).is_pinned}
        <div class="mb-3 flex items-center gap-2">
          <PinIcon size={16} class="filled" />

          <p class="text-sm">{$t('course.navItem.news_feed.pinned')}</p>
        </div>
      {/if}
      <NewsFeedCard
        feed={feed as any}
        comments={newsfeedApi.commentsByFeedId[feed.id]}
        {courseId}
        {deleteFeed}
        {addNewComment}
        {deleteComment}
        {addNewReaction}
        {onPin}
        {author}
        bind:edit
        bind:editFeed
        isActive={feedId === feed.id}
      />
    {/each}
  {/if}
</RoleBasedSecurity>
