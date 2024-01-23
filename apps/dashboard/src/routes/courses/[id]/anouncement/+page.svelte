<script>
  // @ts-nocheck

  import PageNav from '$lib/components/PageNav/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import { course } from '$lib/components/Course/store';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { isNewAnouncementModal } from '$lib/components/Course/components/Anouncements/store';
  import AnouncementCard from '$lib/components/Course/components/Anouncements/AnouncementCard.svelte';

  import Repeat from 'carbon-icons-svelte/lib/Repeat.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import NewAnouncementModal from '$lib/components/Course/components/Anouncements/NewAnouncementModal.svelte';

  export let data;
  let isStudent = false;

  function generateUniqueId() {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 1000000);
    const uniqueId = `${timestamp}${randomPart}`;
    return uniqueId;
  }

  const getCurrentTime = () => {
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    const currentTime = new Date().toLocaleTimeString('en-US', options);
    return currentTime;
  };

  const getEmojiPicker = () => {
    return [
      { name: 'smile', icon: '😀', count: 0 },
      { name: 'thumbsup', icon: '👍', count: 0 },
      { name: 'thumbsdown', icon: '👎', count: 0 },
      { name: 'clap', icon: '👏', count: 0 }
    ];
  };

  let mockAnouncements = [];

  let newAnouncement = {
    id: generateUniqueId(),
    image:
      'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
    content: '',
    name: 'Best Emmanuel Ibitoye-Rotimi',
    timestamp: getCurrentTime(),
    comments: [],
    emoji: getEmojiPicker()
  };
  const reusePost = () => {};

  const deleteComment = (id) => {
    mockAnouncements = mockAnouncements.flatMap((announcement) => ({
      ...announcement,
      comments: announcement.comments.filter((comment) => comment.id !== id)
    }));
  };
  const addNewComment = (comment, id) => {
    const updatedAnnouncements = mockAnouncements.map((announcement) => {
      if (announcement.id === id) {
        const newComment = {
          id: generateUniqueId(),
          name: 'Nwosu Ifeanyi',
          timestamp: getCurrentTime(),
          content: comment
        };
        return {
          ...announcement,
          comments: [...announcement.comments, { ...newComment }]
        };
      }
      return announcement;
    });

    mockAnouncements = updatedAnnouncements;
  };

  const deleteAnouncement = (/** @type {number} */ id) => {
    const deletedAnouncement = mockAnouncements.filter((anouncement) => anouncement.id !== id);
    return (mockAnouncements = deletedAnouncement);
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
    <button
      class="flex items-center justify-between border-gray-200 bg-gray-50 p-3 w-full h-20 rounded-md my-2 shadow-md"
      on:click={() => ($isNewAnouncementModal.open = true)}
    >
      <div class="flex gap-2">
        <span class="w-7 h-7">
          <img
            src={$course.logo}
            alt="users banner"
            class="w-full h-full rounded-full object-cover"
          />
        </span>
        <button class="flex-1" on:click={() => ($isNewAnouncementModal.open = true)}>
          <p class="text-gray-400 hover:text-gray-500">Anounce something to your class</p>
        </button>
      </div>
      <IconButton
        onClick={reusePost}
        toolTipProps={{ title: 'Reuse Post', hotkeys: [], direction: 'bottom' }}
      >
        <Repeat size={24} />
      </IconButton>
    </button>
    <NewAnouncementModal
      bind:mockAnouncements
      {generateUniqueId}
      {getEmojiPicker}
      {getCurrentTime}
    />
    {#each mockAnouncements as info}
      <AnouncementCard value={info} {deleteAnouncement} {addNewComment} {deleteComment} />
    {/each}
  </PageBody>
</CourseContainer>
