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

  import { onMount } from 'svelte';
  import type { AccountOrg } from '$features/app/types';
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { BookIcon } from '@lucide/svelte';
  import { ROLE } from '@cio/utils/constants';
  import { buildNextNewsfeedReaction, type NewsfeedReactionType } from '@cio/ui/custom/newsfeed-reactions';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  let edit = $state(false);
  let editFeed: Feed | null = $state(null);

  // Page-level loading state: only used for the initial list fetch.
  // Prevents other interactions (react/update/comment/delete) from triggering the full-page skeleton.
  let isListing = $state(true);

  // Per-feed interaction states
  let isReactingByFeedId = $state<Record<string, boolean>>({});

  let query = new URLSearchParams(page.url.search);
  let feedId = query.get('feedId') || '';

  const author = $derived({
    id: courseApi.group.memberId || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatarUrl: $profile.avatarUrl || ''
  });

  const deleteComment = async (feedId: string, commentId: string, parentId?: number) => {
    await newsfeedApi.deleteComment(courseId, feedId, commentId, parentId);
  };

  const addNewReaction = async (reactionType: NewsfeedReactionType, feedId: string, authorId: string) => {
    if (!authorId || isReactingByFeedId[feedId]) return;

    const reactedFeed = newsfeedApi.feeds.find((feed) => feed.id === feedId);
    if (!reactedFeed) return;

    const updatedReaction = buildNextNewsfeedReaction(reactedFeed.reaction ?? undefined, reactionType, authorId);

    isReactingByFeedId = { ...isReactingByFeedId, [feedId]: true };

    try {
      await newsfeedApi.react(courseId, feedId, updatedReaction);
    } finally {
      isReactingByFeedId = { ...isReactingByFeedId, [feedId]: false };
    }

    if (!newsfeedApi.success) {
      snackbar.error('snackbar.course.error.reaction_error');
    }
  };

  const addNewComment = async (comment: string, feedId: string, parentId?: number) => {
    await newsfeedApi.createComment(courseId, feedId, comment, author, parentId);

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

    const pinStatusMessage = newIsPinned
      ? t.get('snackbar.course.success.pinned')
      : t.get('snackbar.course.success.unpinned');

    snackbar.success(`${pinStatusMessage} ${t.get('snackbar.course.success.successfully')}`);
  };

  const deleteFeed = async (id: string) => {
    await newsfeedApi.delete(courseId, id);
  };

  const pinnedFeeds = $derived.by(() => {
    return newsfeedApi.feeds.filter((feed) => Boolean((feed as any).isPinned || (feed as any).is_pinned));
  });

  const unpinnedFeeds = $derived.by(() => {
    return newsfeedApi.feeds.filter((feed) => !((feed as any).isPinned || (feed as any).is_pinned));
  });

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [ROLE.ADMIN, ROLE.TUTOR];

    if (org.customization.course.newsfeed) {
      roles.push(ROLE.STUDENT);
    }

    return roles;
  }

  onMount(async () => {
    try {
      await newsfeedApi.list(courseId);
    } finally {
      isListing = false;
    }
  });
</script>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(`/courses/${courseId}/lessons?next=true`);
  }}
>
  <RoleBasedSecurity allowedRoles={getPageRoles($currentOrg)}>
    <NewFeedModal {courseId} bind:edit bind:editFeed />
  </RoleBasedSecurity>
  {#if isListing}
    <div class="flex w-full flex-col items-center">
      <NewsFeedLoader />
      <NewsFeedLoader />
      <NewsFeedLoader />
    </div>
  {:else if !pinnedFeeds.length && !unpinnedFeeds.length}
    <Empty
      title={$t('course.navItem.news_feed.body_header')}
      description={$t('course.navItem.news_feed.body_content')}
      icon={BookIcon}
      variant="page"
    />
  {:else}
    {#if pinnedFeeds.length > 0}
      <div class="text-muted-foreground mb-3 flex items-center gap-1.5">
        <span class="text-xs font-medium tracking-wider uppercase">
          {$t('course.navItem.news_feed.pinned') || 'Pinned'}
        </span>
      </div>
      {#each pinnedFeeds as feed (feed.id)}
        <NewsFeedCard
          {feed}
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
          isReacting={Boolean(isReactingByFeedId[feed.id])}
        />
      {/each}
    {/if}

    {#if pinnedFeeds.length > 0 && unpinnedFeeds.length > 0}
      <div class="text-muted-foreground mb-3 flex items-center gap-1.5">
        <span class="text-xs font-medium tracking-wider uppercase">
          {$t('course.navItem.news_feed.other_posts')}
        </span>
      </div>
    {/if}

    {#if unpinnedFeeds.length > 0}
      {#each unpinnedFeeds as feed (feed.id)}
        <NewsFeedCard
          {feed}
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
          isReacting={Boolean(isReactingByFeedId[feed.id])}
        />
      {/each}
    {/if}
  {/if}
</RoleBasedSecurity>
