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
  import Repeat from 'carbon-icons-svelte/lib/Repeat.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import NewAnouncementModal from '$lib/components/Course/components/Anouncements/NewAnouncementModal.svelte';
  import {
    createComment,
    deleteNewsFeedComment,
    deleteNewsFeed,
    fetchAnnouncement,
    deleteReaction,
    createReaction
  } from '$lib/utils/services/announcement/index.ts';
  import Box from '$lib/components/Box/index.svelte';

  export let data;

  let id = '';
  let mockedAnouncements;
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

  let mockAnouncements = [];

  const deleteComment = (id) => {
    deleteNewsFeedComment(id);
    mockAnouncements = mockAnouncements.flatMap((announcement) => ({
      ...announcement,
      comment: announcement.comment.filter((comment) => comment.id !== id)
    }));
  };

  const addNewReaction = async (emoji, authorId, id) => {
    let reactionId = '';
    let updatedAnnouncements;

    try {
      const reactedAnnouncements = mockAnouncements.map((announcement) => {
        if (announcement.id !== id) return;
        console.log('user', announcement);
        const isReacted =
          announcement.emoji[emoji].length &&
          announcement.emoji[emoji].some((user) => user.selected_by === authorId);
        console.log(isReacted);
        if (isReacted) {
          console.log('Reaction exists, deleting...');
          deleteReaction(reactionId);
          return (updatedAnnouncements = mockAnouncements.map((announcement) => ({
            ...announcement,
            emoji: {
              ...announcement.emoji,
              [emoji]: announcement.emoji[emoji].filter((user) => user.selectedby !== authorId)
            }
          })));
        } else {
          console.log('User has not reacted yet');
          try {
            console.log('Creating reaction...');
            const response = createReaction(emoji, authorId, id);
            console.log('front', response);
            reacted = response.response.data[0];
            reactionId = reacted.id;

            if (!reacted) return;

            // Add the new reaction to the emoji array
            const newReaction = {
              id: reacted.id,
              created_at: reacted.created_at,
              selectedby: authorId,
              reaction: emoji,
              course_announcement_id: id
            };

            return (updatedAnnouncements = mockAnouncements.map((announcement) => ({
              ...announcement,
              emoji: {
                ...announcement.emoji,
                [emoji]: [...announcement.emoji[emoji], newReaction]
              }
            })));
          } catch (error) {
            console.log(error);
          }
        }
      });

      return (mockAnouncements = reactedAnnouncements);
    } catch (error) {
      console.log(error);
    }
  };

  const addNewComment = async (comment, id, authorId) => {
    try {
      const response = await createComment({
        content: comment,
        author_id: authorId,
        course_announcement_id: id
      });

      createdComment = response.response.data[0];
    } catch (error) {
      console.log(error);
    }

    const updatedAnnouncements = mockAnouncements.map((announcement) => {
      if (announcement.id === id) {
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
          ...announcement,
          comment: [...announcement.comment, { ...newComment }]
        };
      }
      return announcement;
    });

    mockAnouncements = updatedAnnouncements;
  };

  const deleteAnouncement = (/** @type {number} */ id) => {
    deleteNewsFeed(id);
    const deletedAnouncement = mockAnouncements.filter((anouncement) => anouncement.id !== id);
    return (mockAnouncements = deletedAnouncement);
  };

  onMount(async () => {
    currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);
    console.log('groupmember', currentGroupMember, author);
    const { data: _data } = await fetchAnnouncement(data.courseId);

    mockAnouncements = _data.map((announcement) => {
      // currentGroupMember = $group.people.find(
      //   (person) => person.profile_id === announcement.author_id
      // );

      const announcementAuthor = {
        id: currentGroupMember?.id || '',
        username: $profile.username || '',
        fullname: $profile.fullname || '',
        avatar: $profile.avatar_url || ''
      };

      const commentsWithAuthor = announcement.comment.map((comment) => {
        // const commentAuthor = $group.people.find(
        //   (person) => person.profile_id === comment.author_id
        // );

        const commentAuthorObject = {
          id: currentGroupMember?.id || '',
          username: $profile.username || '',
          fullname: $profile.fullname || '',
          avatar: $profile.avatar_url || ''
        };
        return {
          ...comment,
          author: commentAuthorObject
        };
      });

      // announcement.emojis.forEach((emojiGroup) => {
      //   Object.keys(emojiGroup).forEach((emojiType) => {
      //     emojis[emojiType] = emojiGroup[emojiType].map((emoji) => {
      //       return {
      //         id: emoji.id,
      //         username: emoji.username,
      //         fullname: emoji.fullname
      //       };
      //     });
      //   });
      // });

      return {
        ...announcement,
        author: announcementAuthor,
        comment: commentsWithAuthor,
        emoji: reaction
      };
    });
    console.log('announcements', mockAnouncements);
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
  <PageNav title="Anouncements" disableSticky={true}>
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
        bind:mockAnouncements
        courseId={data.courseId}
        bind:id
        {author}
        emoji={reaction}
      />
    </RoleBasedSecurity>

    {#if !mockAnouncements}
      <Box>
        <div class="flex justify-between flex-col items-center w-[90%] md:w-96">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="my-2.5 mx-auto" />
          <h2 class="text-xl my-1.5 font-normal">No announcement yet</h2>
          <p class="text-sm text-center text-slate-500">
            Make an announcement to your class. Start by clicking on the Add button.
          </p>
        </div>
      </Box>
    {:else}
      {#each mockAnouncements as info}
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
