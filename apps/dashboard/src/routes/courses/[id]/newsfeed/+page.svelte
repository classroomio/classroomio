<script lang="ts">
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import { group } from '$lib/components/Course/store';
  import { profile } from '$lib/utils/store/user';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';
  import NewsFeedCard from '$lib/components/Course/components/NewsFeed/NewsFeedCard.svelte';
  import NewFeedModal from '$lib/components/Course/components/NewsFeed/NewFeedModal.svelte';
  import {
    createComment,
    deleteNewsFeedComment,
    deleteNewsFeed,
    fetchNewsFeeds,
    editFeed
  } from '$lib/utils/services/newsfeed/index';
  import Box from '$lib/components/Box/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { Feed } from '$lib/utils/types/feed';

  export let data;

  let isStudent = false;
  let currentGroupMember;
  let createdComment;
  let edit = false;
  let editValue = {};

  let author = {
    id: '',
    username: '',
    fullname: '',
    avatar: ''
  };

  let reaction = {
    smile: [],
    thumbsup: [],
    thumbsdown: [],
    clap: []
  };

  let newsFeed: Feed[] = [];

  const onEdit = (id: string, content: string) => {
    editFeed(id, content);
    newsFeed = newsFeed.map((feed) => {
      if (feed.id === id) {
        return { ...feed, content: content };
      }

      return feed;
    });
  };

  const deleteComment = (id: string) => {
    deleteNewsFeedComment(id);
    newsFeed = newsFeed.flatMap((feed) => ({
      ...feed,
      comment: feed.comment.filter((comment) => comment.id !== id)
    }));

    return snackbar.success('Comment deleted successfully');
  };

  const addNewReaction = async (reactionType: string, feedId: string, authorId: string) => {
    const reactedFeed = newsFeed.find((feed) => feed.id === feedId);

    if (!reactedFeed) return;
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
      return snackbar.error('An error occurred while reacting to news feed');
    }

    newsFeed = newsFeed.map((feed) => {
      if (feed.id === feedId) {
        feed.reaction = reactedFeed.reaction;
      }

      return feed;
    });
  };

  const addNewComment = async (comment: string, feedId: string, authorId: string) => {
    try {
      const response = await createComment({
        content: comment,
        author_id: authorId,
        course_newsfeed_id: feedId
      });
      if (!response.response.data) return;
      createdComment = response?.response?.data[0];
    } catch (error) {
      return snackbar.error('An error occurred while creating comment');
    }

    const updatedFeed = newsFeed.map((feed) => {
      if (feed.id === feedId) {
        const newComment = {
          id: createdComment.id,
          author: {
            profile: {
              id: author.id,
              username: author.username,
              fullname: author.fullname,
              avatar_url: author.avatar
            }
          },
          created_at: createdComment.created_at,
          content: comment
        };

        return {
          ...feed,
          comment: [...feed.comment, { ...newComment }]
        };
      }
      snackbar.success('comment added successfully');
      return feed;
    });

    newsFeed = updatedFeed;
  };

  const deleteFeed = (id: string) => {
    deleteNewsFeed(id);
    const deletedFeed = newsFeed.filter((feed) => feed.id !== id);
    snackbar.success('Feed deleted successfully');
    return (newsFeed = deletedFeed);
  };

  const setAllFeed = async () => {
    const { data: feed } = await fetchNewsFeeds(data.courseId);
    if (!feed) return;
    newsFeed = feed.map((feed) => {
      return {
        ...feed,
        emoji: reaction
      };
    });
  };

  $: setAllFeed();

  $: currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);
  $: author = {
    id: currentGroupMember?.id || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatar: $profile.avatar_url || ''
  };
</script>

<CourseContainer bind:isStudent bind:courseId={data.courseId}>
  <PageNav title="News Feed" disableSticky={true}>
    <slot:fragment slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton className="mr-2" label="Add" onClick={() => ($isNewFeedModal.open = true)} />
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>

  <PageBody width="max-w-4xl px-3">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <NewFeedModal
        courseId={data.courseId}
        {author}
        bind:edit
        bind:editValue
        onSave={(newFeed) => {
          newsFeed = [newFeed, ...newsFeed];
        }}
        {onEdit}
      />
    </RoleBasedSecurity>

    {#if !newsFeed.length}
      <Box>
        <div class="flex justify-between flex-col items-center w-[90%] md:w-96">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="my-2.5 mx-auto" />
          <h2 class="text-xl my-1.5 font-normal">No post yet</h2>
          <p class="text-sm text-center text-slate-500">
            Make a post to your class. Start by clicking on the Add button.
          </p>
        </div>
      </Box>
    {:else}
      {#each newsFeed as info}
        <NewsFeedCard
          value={info}
          {deleteFeed}
          {addNewComment}
          {deleteComment}
          {addNewReaction}
          {author}
          bind:edit
          bind:editValue
        />
      {/each}
    {/if}
  </PageBody>
</CourseContainer>
