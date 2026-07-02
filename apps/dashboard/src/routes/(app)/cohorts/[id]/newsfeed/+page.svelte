<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { NewsFeedLoader } from '$features/course/components/newsfeed';
  import { NewFeedModal, NewsFeedCard } from '$features/cohort/components/newsfeed';
  import MyGoalsWidget from '$features/cohort/components/goals/my-goals-widget.svelte';
  import { cohortApi, cohortNewsfeedApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';
  import type { CohortNewsfeedItem } from '$features/cohort/utils/types';
  import PinIcon from '@lucide/svelte/icons/pin';
  import { BookIcon } from '@lucide/svelte';
  import { buildNextNewsfeedReaction, type NewsfeedReactionType } from '@cio/ui/custom/newsfeed-reactions';
  import { preloadTextEditor } from '$features/ui';

  interface Props {
    data: {
      cohortId: string;
    };
  }

  let { data }: Props = $props();

  const cohortId = data.cohortId;

  let edit = $state(false);
  let editFeed: CohortNewsfeedItem | null = $state(null);
  let isListing = $state(true);
  let isReactingByFeedId = $state<Record<string, boolean>>({});

  const query = new URLSearchParams(page.url.search);
  const activeFeedId = query.get('feedId') || '';

  const currentCohortMember = $derived.by(
    () => cohortApi.members.find((member) => member.profile?.id === $profile.id) ?? null
  );

  const reactionAuthorId = $derived(currentCohortMember?.id || '');

  const currentCohortRoleId = $derived(currentCohortMember?.roleId || null);

  const author = $derived({
    id: $profile.id || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatarUrl: $profile.avatarUrl || ''
  });

  const canCreateNewsfeed = $derived(
    Boolean($isOrgAdmin) || currentCohortRoleId === ROLE.ADMIN || currentCohortRoleId === ROLE.TUTOR
  );
  const canManageNewsfeed = $derived(Boolean($isOrgAdmin) || canCreateNewsfeed);
  const canComment = $derived(Boolean(reactionAuthorId));

  const sortedFeeds = $derived.by(() => {
    return [...cohortNewsfeedApi.feeds].sort((firstFeed, secondFeed) => {
      return Number(Boolean(secondFeed.isPinned)) - Number(Boolean(firstFeed.isPinned));
    });
  });

  const loadNewsfeed = async () => {
    isListing = true;

    try {
      await cohortNewsfeedApi.list(cohortId);
    } finally {
      isListing = false;
    }
  };

  const deleteComment = async (feedId: string, commentId: string) => {
    await cohortNewsfeedApi.deleteComment(cohortId, feedId, commentId);
  };

  const addNewReaction = async (reactionType: NewsfeedReactionType, feedId: string, authorId: string) => {
    if (!authorId || isReactingByFeedId[feedId]) return;

    const reactedFeed = cohortNewsfeedApi.feeds.find((feed) => feed.id === feedId);
    if (!reactedFeed) return;

    const updatedReaction = buildNextNewsfeedReaction(reactedFeed.reaction ?? undefined, reactionType, authorId);

    isReactingByFeedId = { ...isReactingByFeedId, [feedId]: true };

    try {
      await cohortNewsfeedApi.react(cohortId, feedId, updatedReaction);
    } finally {
      isReactingByFeedId = { ...isReactingByFeedId, [feedId]: false };
    }
  };

  const addNewComment = async (comment: string, feedId: string) => {
    await cohortNewsfeedApi.createComment(cohortId, feedId, comment, author);
  };

  const onPin = async (feedId: string, isPinned: boolean | null) => {
    await cohortNewsfeedApi.update(cohortId, feedId, { isPinned: !isPinned });
  };

  const deleteFeed = async (feedId: string) => {
    await cohortNewsfeedApi.delete(cohortId, feedId);
  };

  onMount(async () => {
    void preloadTextEditor();
    await loadNewsfeed();
  });
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('cohorts.sidebar.newsfeed')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      {#if canCreateNewsfeed}
        <Button onmouseenter={() => preloadTextEditor()} onclick={() => cohortNewsfeedApi.openNewFeedModal()}>
          {$t('cohorts.newsfeed.post')}
        </Button>
      {/if}
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <NewFeedModal {cohortId} bind:edit bind:editFeed />

      <MyGoalsWidget {cohortId} />

      {#if isListing}
        <div class="flex w-full flex-col items-center">
          <NewsFeedLoader />
          <NewsFeedLoader />
          <NewsFeedLoader />
        </div>
      {:else if !sortedFeeds.length}
        <Empty
          title={$t('cohorts.newsfeed.empty_title')}
          description={$t('cohorts.newsfeed.empty_description')}
          icon={BookIcon}
          variant="page"
        >
          {#if canCreateNewsfeed}
            <Button onmouseenter={() => preloadTextEditor()} onclick={() => cohortNewsfeedApi.openNewFeedModal()}>
              {$t('cohorts.newsfeed.post')}
            </Button>
          {/if}
        </Empty>
      {:else}
        {#each sortedFeeds as feed (feed.id)}
          {#if feed.isPinned}
            <div class="flex items-center gap-2">
              <PinIcon size={16} class="filled" />
              <p class="text-sm">{$t('cohorts.newsfeed.pinned')}</p>
            </div>
          {/if}

          <NewsFeedCard
            {feed}
            comments={cohortNewsfeedApi.commentsByFeedId[feed.id]}
            {cohortId}
            {author}
            {reactionAuthorId}
            {canComment}
            canManageFeed={canManageNewsfeed}
            {deleteFeed}
            {deleteComment}
            {addNewComment}
            {addNewReaction}
            {onPin}
            bind:edit
            bind:editFeed
            isActive={activeFeedId === feed.id}
            isReacting={Boolean(isReactingByFeedId[feed.id])}
          />
        {/each}
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
