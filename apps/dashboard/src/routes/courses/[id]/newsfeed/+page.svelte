<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import { group, course } from '$lib/components/Course/store';
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
    fetchNewsFeeds
  } from '$lib/utils/services/newsfeed/index';
  import Box from '$lib/components/Box/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';

  export let data;

  let isStudent = false;
  let currentGroupMember;
  let createdComment;

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

  let newsFeed = [];

  const deleteComment = (id) => {
    deleteNewsFeedComment(id);
    newsFeed = newsFeed.flatMap((feed) => ({
      ...feed,
      comment: feed.comment.filter((comment) => comment.id !== id)
    }));
  };

  const addNewReaction = async (reactionType, feedId, authorId) => {
    const reactedFeed = newsFeed.find((feed) => feed.id === feedId);

    if (!reactedFeed) return;
    let reactedAuthorIds = reactedFeed.reaction[reactionType];
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

  const addNewComment = async (comment, feedId, authorId) => {
    try {
      const response = await createComment({
        content: comment,
        author_id: authorId,
        course_newsfeed_id: feedId
      });

      createdComment = response.response.data[0];
    } catch (error) {
      return snackbar.error('An error occurred while creating comment');
    }

    const updatedFeed = newsFeed.map((feed) => {
      if (feed.id === feedId) {
        const newComment = {
          id: createdComment.id,
          author: {
            id: author.id,
            username: author.username,
            fullname: author.fullname,
            avatar: author.avatar
          },
          created_at: createdComment.created_at,
          content: comment
        };

        return {
          ...feed,
          comment: [...feed.comment, { ...newComment }]
        };
      }

      return feed;
    });

    newsFeed = updatedFeed;
  };

  const deleteFeed = (id) => {
    deleteNewsFeed(id);
    const deletedFeed = newsFeed.filter((feed) => feed.id !== id);
    return (newsFeed = deletedFeed);
  };

  onMount(async () => {
    currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);

    const { data: _data } = await fetchNewsFeeds(data.courseId);

    newsFeed = _data.map((feed) => {
      const feedAuthorDetails = $group.people.find((person) => person.id === feed.author_id);

      const feedAuthor = {
        id: feedAuthorDetails?.id || '',
        username: feedAuthorDetails?.profile.username || '',
        fullname: feedAuthorDetails?.profile.fullname || '',
        avatar: feedAuthorDetails?.profile.avatar_url || ''
      };

      const commentWithAuthor = feed.comment.map((comment) => {
        const commentAuthorDetails = $group.people.find(
          (person) => person.id === comment.author_id
        );

        const commentAuthor = {
          id: commentAuthorDetails?.id || '',
          username: commentAuthorDetails?.profile.username || '',
          fullname: commentAuthorDetails?.profile.fullname || '',
          avatar: commentAuthorDetails?.profile.avatar_url || ''
        };

        return {
          ...comment,
          author: commentAuthor
        };
      });

      return {
        ...feed,
        author: feedAuthor,
        comment: commentWithAuthor,
        emoji: reaction
      };
    });
  });

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
        onSave={(newFeed) => {
          newsFeed = [newFeed, ...newsFeed];
        }}
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
        />
      {/each}
    {/if}
  </PageBody>
</CourseContainer>
