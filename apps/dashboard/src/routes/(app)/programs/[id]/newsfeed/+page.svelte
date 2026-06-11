<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { NewsFeedLoader } from '$features/course/components/newsfeed';
  import { NewFeedModal, NewsFeedCard } from '$features/program/components/newsfeed';
  import MyGoalsWidget from '$features/program/components/goals/my-goals-widget.svelte';
  import { programApi, programNewsfeedApi } from '$features/program/api';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';
  import type { ProgramNewsfeedItem } from '$features/program/utils/types';
  import PinIcon from '@lucide/svelte/icons/pin';
  import { BookIcon } from '@lucide/svelte';
  import { buildNextNewsfeedReaction, type NewsfeedReactionType } from '@cio/ui/custom/newsfeed-reactions';
  import { preloadTextEditor } from '$features/ui';

  interface Props {
    data: {
      programId: string;
    };
  }

  let { data }: Props = $props();

  const programId = data.programId;

  let edit = $state(false);
  let editFeed: ProgramNewsfeedItem | null = $state(null);
  let isListing = $state(true);
  let isReactingByFeedId = $state<Record<string, boolean>>({});

  const query = new URLSearchParams(page.url.search);
  const activeFeedId = query.get('feedId') || '';

  const currentProgramMember = $derived.by(
    () => programApi.members.find((member) => member.profile?.id === $profile.id) ?? null
  );

  const reactionAuthorId = $derived(currentProgramMember?.id || '');

  const currentProgramRoleId = $derived(currentProgramMember?.roleId || null);

  const author = $derived({
    id: $profile.id || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatarUrl: $profile.avatarUrl || ''
  });

  const canCreateNewsfeed = $derived(
    Boolean($isOrgAdmin) || currentProgramRoleId === ROLE.ADMIN || currentProgramRoleId === ROLE.TUTOR
  );
  const canManageNewsfeed = $derived(Boolean($isOrgAdmin) || canCreateNewsfeed);
  const canComment = $derived(Boolean(reactionAuthorId));

  const sortedFeeds = $derived.by(() => {
    return [...programNewsfeedApi.feeds].sort((firstFeed, secondFeed) => {
      return Number(Boolean(secondFeed.isPinned)) - Number(Boolean(firstFeed.isPinned));
    });
  });

  const loadNewsfeed = async () => {
    isListing = true;

    try {
      await programNewsfeedApi.list(programId);
    } finally {
      isListing = false;
    }
  };

  const deleteComment = async (feedId: string, commentId: string) => {
    await programNewsfeedApi.deleteComment(programId, feedId, commentId);
  };

  const addNewReaction = async (reactionType: NewsfeedReactionType, feedId: string, authorId: string) => {
    if (!authorId || isReactingByFeedId[feedId]) return;

    const reactedFeed = programNewsfeedApi.feeds.find((feed) => feed.id === feedId);
    if (!reactedFeed) return;

    const updatedReaction = buildNextNewsfeedReaction(reactedFeed.reaction ?? undefined, reactionType, authorId);

    isReactingByFeedId = { ...isReactingByFeedId, [feedId]: true };

    try {
      await programNewsfeedApi.react(programId, feedId, updatedReaction);
    } finally {
      isReactingByFeedId = { ...isReactingByFeedId, [feedId]: false };
    }
  };

  const addNewComment = async (comment: string, feedId: string) => {
    await programNewsfeedApi.createComment(programId, feedId, comment, author);
  };

  const onPin = async (feedId: string, isPinned: boolean | null) => {
    await programNewsfeedApi.update(programId, feedId, { isPinned: !isPinned });
  };

  const deleteFeed = async (feedId: string) => {
    await programNewsfeedApi.delete(programId, feedId);
  };

  onMount(async () => {
    void preloadTextEditor();
    await loadNewsfeed();
  });
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('programs.sidebar.newsfeed')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      {#if canCreateNewsfeed}
        <Button onmouseenter={() => preloadTextEditor()} onclick={() => programNewsfeedApi.openNewFeedModal()}>
          {$t('programs.newsfeed.post')}
        </Button>
      {/if}
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <NewFeedModal {programId} bind:edit bind:editFeed />

      <MyGoalsWidget {programId} />

      {#if isListing}
        <div class="flex w-full flex-col items-center">
          <NewsFeedLoader />
          <NewsFeedLoader />
          <NewsFeedLoader />
        </div>
      {:else if !sortedFeeds.length}
        <Empty
          title={$t('programs.newsfeed.empty_title')}
          description={$t('programs.newsfeed.empty_description')}
          icon={BookIcon}
          variant="page"
        >
          {#if canCreateNewsfeed}
            <Button onmouseenter={() => preloadTextEditor()} onclick={() => programNewsfeedApi.openNewFeedModal()}>
              {$t('programs.newsfeed.post')}
            </Button>
          {/if}
        </Empty>
      {:else}
        {#each sortedFeeds as feed (feed.id)}
          {#if feed.isPinned}
            <div class="flex items-center gap-2">
              <PinIcon size={16} class="filled" />
              <p class="text-sm">{$t('programs.newsfeed.pinned')}</p>
            </div>
          {/if}

          <NewsFeedCard
            {feed}
            comments={programNewsfeedApi.commentsByFeedId[feed.id]}
            {programId}
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
