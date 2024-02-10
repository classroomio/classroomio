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
  import { isNewAnouncementModal } from '$lib/components/Course/components/Anouncements/store';
  import AnouncementCard from '$lib/components/Course/components/Anouncements/AnouncementCard.svelte';
  import NewAnouncementModal from '$lib/components/Course/components/Anouncements/NewAnouncementModal.svelte';
  import {
    createComment,
    deleteNewsFeedComment,
    deleteNewsFeed,
    fetchAnnouncement
  } from '$lib/utils/services/announcement/index.ts';
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

  // when react = feedId,authorId and reactionType
  // 1.we need the array of feeds
  // 2.find feed by feedId
  // 3. find reaction by reactionType
  // 4. if authorId in reaction, remove authorId from array
  // 5. else add into array
  // 6. make request to supabase to update feed by feedId.

  const addNewReaction = async (reactionType, feedId, authorId) => {
    const reactedFeed = newsFeed.find((feed) => feed.id === feedId);

    if (!reactedFeed) return;
    console.log('after return');
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

    // updating the database
    const response = await supabase
      .from('course_newsfeed')
      .update({
        reaction: reactedFeed.reaction
      })
      .eq('id', feedId);

    if (response.error) {
      console.error('error reacting to news feed', response.error);
      return snackbar.error('An error occurred while reacting to news feed');
    }

    //updating the UI
    newsFeed = newsFeed.map((feed) => {
      if (feed.id === feedId) {
        feed.reaction = reactedFeed.reaction;
      }
      return feed;
    });
  };

  //addNewCooment
  // when user comments, get the comment, feedId and authorId
  // update the supabase table with the comment, feedId and authorId
  // find feed using feedId
  // when feed found, set the new comment object to the comment array

  const addNewComment = async (comment, feedId, authorId) => {
    // set supabase course_newsfeed_comment table
    // this returns a response with a comment id and a created_at value

    console.log('parent', comment, feedId, authorId);
    try {
      const response = await createComment({
        content: comment,
        author_id: authorId,
        course_newsfeed_id: feedId
      });

      createdComment = response.response.data[0];
    } catch (error) {
      console.log(error);
      return snackbar.error('An error occurred while creating comment');
    }

    // the comment_id and the created_at value are used to populate the new comment object for rendering

    const updatedFeeds = newsFeed.map((feed) => {
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

    newsFeed = updatedFeeds;
  };

  const deleteAnouncement = (/** @type {string} */ id) => {
    deleteNewsFeed(id);
    const deletedFeed = newsFeed.filter((feed) => feed.id !== id);
    return (newsFeed = deletedFeed);
  };

  onMount(async () => {
    currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);
    console.log('groupmember', $group.people, currentGroupMember, author);
    const { data: _data } = await fetchAnnouncement(data.courseId);

    newsFeed = _data.map((feed) => {
      //WHAT TO DO
      // for each feed/comments i need the profile details of the author
      // i have an author_id from the course_newsfeed in the database
      // i want that author_id to be used to get the details of the author of each comment and feed(since there could be more than one tutor or admin) onMount

      //WHAT DO I KNOW
      // when creating an feed/comment, the author_id in the database is set to the groupmemberId not profile_id
      // so to get the author details onMount, i need to find the groupmember.id = author_id and extract their details

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

        // returns each comments with an author object having the author details
        return {
          ...comment,
          author: commentAuthor
        };
      });

      // returns each feed with the author details
      return {
        ...feed,
        author: feedAuthor,
        comment: commentWithAuthor,
        emoji: reaction
      };
    });
    console.log('announcements', newsFeed);
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
        <PrimaryButton
          className="mr-2"
          label="Add"
          onClick={() => ($isNewAnouncementModal.open = true)}
        />
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>

  <PageBody width="max-w-4xl px-3">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <NewAnouncementModal
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
            Make an announcement to your class. Start by clicking on the Add button.
          </p>
        </div>
      </Box>
    {:else}
      {#each newsFeed as info}
        <AnouncementCard
          value={info}
          {deleteAnouncement}
          {addNewComment}
          {deleteComment}
          {addNewReaction}
          {author}
        />
      {/each}
    {/if}
  </PageBody>
</CourseContainer>
