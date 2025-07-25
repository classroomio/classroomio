<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Box from '$lib/components/Box/index.svelte';
  import NewsFeedCard from '$lib/components/Course/components/NewsFeed/NewsFeedCard.svelte';
  import NewsFeedLoader from '$lib/components/Course/components/NewsFeed/NewsFeedLoader.svelte';
  import { isNewFeedModal, newsFeed } from '$lib/components/Course/components/NewsFeed/store';
  import { group } from '$lib/components/Course/store';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { onMount } from 'svelte';
  import { SkeletonPlaceholder } from 'carbon-components-svelte';
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
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { Feed } from '$lib/utils/types/feed';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import PinFilled from 'carbon-icons-svelte/lib/PinFilled.svelte';

  export let data;

  let createdComment;
  let edit = false;
  let isLoading = false;
  let editFeed: Feed;
  let author = {
    id: '',
    username: '',
    fullname: '',
    avatar_url: ''
  };

  let query = new URLSearchParams($page.url.search);
  let feedId = query.get('feedId') || '';

  let NewFeedModal;
  let isNewFeedModalLoading = true;

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const module = await import('$lib/components/Course/components/NewsFeed/NewFeedModal.svelte');
      NewFeedModal = module.default;
      isNewFeedModalLoading = false;
    }
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
      reactedAuthorIds = reactedAuthorIds.filter(
        (reactionAuthorId) => reactionAuthorId !== authorId
      );
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
        $newsFeed = data.map((feedItem) => ({
          ...feedItem,
          isPinned: feedItem.is_pinned
        }));
      }
    } catch (error) {
      snackbar.error('snackbar.course.error.feed_fetch_error');
    } finally {
      isLoading = false;
    }
  };

  function setAuthor(groups, profileId) {
    const currentGroupMember = groups.people.find((person) => person.profile_id === profileId);

    author = {
      id: currentGroupMember?.id || '',
      username: $profile.username || '',
      fullname: $profile.fullname || '',
      avatar_url: $profile.avatar_url || ''
    };
  }

  function getPageRoles(org: CurrentOrg) {
    const roles: number[] = [1, 2];

    if (org.customization.course.newsfeed) {
      roles.push(3);
    }

    return roles;
  }

  $: initNewsFeed(data.courseId);

  $: setAuthor($group, $profile.id);
  $: $newsFeed = $newsFeed.sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
</script>

<CourseContainer bind:courseId={data.courseId}>
  <RoleBasedSecurity
    allowedRoles={getPageRoles($currentOrg)}
    onDenied={() => {
      goto(`/courses/${data.courseId}/lessons?next=true`);
    }}
  >
    <PageNav title={$t('course.navItem.news_feed.heading')} disableSticky={true}>
      <slot:fragment slot="widget">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <PrimaryButton
            className="mr-2"
            label={$t('course.navItem.news_feed.heading_button.title')}
            onClick={() => ($isNewFeedModal.open = true)}
          />
        </RoleBasedSecurity>
      </slot:fragment>
    </PageNav>

    <PageBody width="max-w-4xl px-3">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if isNewFeedModalLoading && $isNewFeedModal}
          <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <SkeletonPlaceholder style="width: 600px; height: 400px;" />
          </div>
        {:else if NewFeedModal}
          <svelte:component this={NewFeedModal} />
        {/if}
      </RoleBasedSecurity>
      {#if isLoading}
        <div>
          <NewsFeedLoader />
          <NewsFeedLoader />
          <NewsFeedLoader />
        </div>
      {:else if !$newsFeed.length}
        <Box>
          <div class="flex w-[90%] flex-col items-center justify-between md:w-96">
            <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="mx-auto my-2.5" />
            <h2 class="my-1.5 text-xl font-normal">{$t('course.navItem.news_feed.body_header')}</h2>
            <p class="text-center text-sm text-slate-500">
              {$t('course.navItem.news_feed.body_content')}
            </p>
          </div>
        </Box>
      {:else}
        {#each $newsFeed as feed}
          {#if feed.isPinned}
            <div class="mb-3 flex items-center gap-2">
              <PinFilled size={16} />

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
