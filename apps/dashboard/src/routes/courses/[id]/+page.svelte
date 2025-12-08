<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import NewFeedModal from '$lib/components/Course/components/NewsFeed/NewFeedModal.svelte';
  import NewsFeedCard from '$lib/components/Course/components/NewsFeed/NewsFeedCard.svelte';
  import NewsFeedLoader from '$lib/components/Course/components/NewsFeed/NewsFeedLoader.svelte';
  import { isNewFeedModal, newsFeed } from '$lib/components/Course/components/NewsFeed/store';
  import { group } from '$lib/components/Course/store';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { PageBody } from '$lib/components/Page';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$lib/features/ui';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import {
    createComment,
    deleteNewsFeed,
    deleteNewsFeedComment,
    fetchNewsFeedReaction,
    fetchNewsFeeds,
    handleEditFeed,
    toggleFeedIsPinned
  } from '$lib/utils/services/newsfeed';
  import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { Feed } from '$lib/utils/types/feed';
  import PinIcon from '@lucide/svelte/icons/pin';
  import { onMount } from 'svelte';
  import type { AccountOrg } from '$lib/features/app/types';
  import { getGreeting } from '$lib/utils/functions/date.js';
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { BookIcon } from '@lucide/svelte';

  let { data = $bindable() } = $props();

  let createdComment;
  let edit = $state(false);
  let isLoading = $state(false);
  let editFeed: Feed | null = $state(null);

  let query = new URLSearchParams(page.url.search);
  let feedId = query.get('feedId') || '';

  const author = $derived.by(() => {
    const groupMember = $group.people.find((person) => person.profile_id === $profile.id);

    return {
      id: groupMember?.id || '',
      username: $profile.username || '',
      fullname: $profile.fullname || '',
      avatar_url: $profile.avatarUrl || ''
    };
  });

  const onEdit = (id: string, content: string) => {
    handleEditFeed(id, content);

    $newsFeed = $newsFeed.map((feed) => {
      if (feed.id === id) {
        return { ...feed, content: content };
      }

      return feed;
    });
  };

  const deleteComment = (id: string) => {
    deleteNewsFeedComment(id);
    $newsFeed = $newsFeed.flatMap((feed) => ({
      ...feed,
      comment: feed.comment.filter((comment) => comment.id !== id)
    }));

    return snackbar.success('snackbar.course.success.comment_deleted');
  };

  const addNewReaction = async (reactionType: string, feedId: string, authorId: string) => {
    const { data } = await fetchNewsFeedReaction(feedId);

    if (!data) return;

    const reactedFeed = data || $newsFeed.find((feed) => feed.id === feedId);

    let reactedAuthorIds: string[] = reactedFeed.reaction[reactionType];

    if (reactedAuthorIds.includes(authorId)) {
      reactedAuthorIds = reactedAuthorIds.filter((reactionAuthorId) => reactionAuthorId !== authorId);
    } else {
      reactedAuthorIds = [...reactedAuthorIds, authorId];
    }

    reactedFeed.reaction = {
      ...reactedFeed.reaction,
      [reactionType]: reactedAuthorIds
    };

    const response = await supabase
      .from('course_newsfeed')
      .update({
        reaction: reactedFeed.reaction
      })
      .eq('id', feedId);

    if (response.error) {
      return snackbar.error('snackbar.course.error.reaction_error');
    }

    $newsFeed = $newsFeed.map((feed) => {
      if (feed.id === feedId) {
        feed.reaction = reactedFeed.reaction;
      }

      return feed;
    });
  };

  const addNewComment = async (comment: string, feedId: string, authorId: string) => {
    const { response } = await createComment({
      content: comment,
      author_id: authorId,
      course_newsfeed_id: feedId
    });

    if (response.error) {
      return snackbar.error('snackbar.course.error.commenting_error');
    }

    if (!response.data) return;

    createdComment = response?.data[0];

    triggerSendEmail(NOTIFICATION_NAME.NEWSFEED, {
      authorId: author.id,
      feedId: feedId,
      comment
    });

    $newsFeed = $newsFeed.map((feed) => {
      if (feed.id === feedId) {
        const newComment = {
          id: createdComment.id,
          author: {
            profile: { ...author }
          },
          created_at: createdComment.created_at,
          content: comment
        };

        snackbar.success('snackbar.course.success.comment_added');

        return {
          ...feed,
          comment: [...feed.comment, { ...newComment }]
        };
      }

      return feed;
    });
  };

  const onPin = async (feedId, isPinned) => {
    const newIsPinned = !isPinned;
    const { response } = await toggleFeedIsPinned(feedId, newIsPinned);

    if (response.error) {
      return snackbar.error('snackbar.course.error.toggle_error');
    }

    $newsFeed = $newsFeed.map((feed) => {
      if (feed.id === feedId) {
        snackbar.success(
          `${
            newIsPinned ? 'snackbar.course.success.pinned' : 'snackbar.course.success.unpinned'
          } snackbar.course.success.successfully`
        );

        feed.isPinned = newIsPinned;
        return feed;
      }

      return feed;
    });
  };

  const deleteFeed = (id: string) => {
    deleteNewsFeed(id);

    const deletedFeed = $newsFeed.filter((feed) => feed.id !== id);
    snackbar.success('snackbar.course.success.feed_delete_success');

    $newsFeed = deletedFeed;
  };

  const initNewsFeed = async (courseId: string) => {
    if (!courseId) return;
    try {
      isLoading = true;
      const { data, error } = await fetchNewsFeeds(courseId);
      if (error) {
        snackbar.error('snackbar.course.error.news_feed_fail');
      }
      if (data) {
        $newsFeed = data
          .map((feedItem) => ({
            ...feedItem,
            isPinned: feedItem.is_pinned
          }))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
      }
    } catch (error) {
      snackbar.error('snackbar.course.error.feed_fetch_error');
    } finally {
      isLoading = false;
    }
  };

  function getPageRoles(org: AccountOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }

  onMount(() => {
    initNewsFeed(data.courseId);
  });
</script>

<CourseContainer courseId={data.courseId}>
  <RoleBasedSecurity
    allowedRoles={getPageRoles($currentOrg)}
    onDenied={() => {
      goto(`/courses/${data.courseId}/lessons?next=true`);
    }}
  >
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t(getGreeting())}
          {$profile.fullname}!
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <Button class="mr-2" onclick={() => ($isNewFeedModal.open = true)}>
          {$t('course.navItem.news_feed.heading_button.title')}
        </Button>
      </Page.Action>
    </Page.Header>

    <PageBody width="max-w-4xl px-3">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <NewFeedModal
          courseId={data.courseId}
          {author}
          bind:edit
          bind:editFeed
          onSave={(newFeed) => {
            $newsFeed = [newFeed, ...$newsFeed];
          }}
          {onEdit}
        />
      </RoleBasedSecurity>
      {#if isLoading}
        <div>
          <NewsFeedLoader />
          <NewsFeedLoader />
          <NewsFeedLoader />
        </div>
      {:else if !$newsFeed.length}
        <Empty
          title={$t('course.navItem.news_feed.body_header')}
          description={$t('course.navItem.news_feed.body_content')}
          icon={BookIcon}
          class="h-full"
        ></Empty>
      {:else}
        {#each $newsFeed as feed}
          {#if feed.isPinned}
            <div class="mb-3 flex items-center gap-2">
              <PinIcon size={16} class="filled" />

              <p class="text-sm">{$t('course.navItem.news_feed.pinned')}</p>
            </div>
          {/if}
          <NewsFeedCard
            {feed}
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
    </PageBody>
  </RoleBasedSecurity>
</CourseContainer>
