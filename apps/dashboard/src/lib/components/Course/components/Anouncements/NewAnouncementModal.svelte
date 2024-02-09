<script>
  // @ts-nocheck

  import Modal from '$lib/components/Modal/index.svelte';
  import {
    anouncementList,
    isNewAnouncementModal
  } from '$lib/components/Course/components/Anouncements/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { Dropdown } from 'carbon-components-svelte';
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import { Link } from 'carbon-icons-svelte';
  import Upload from 'carbon-icons-svelte/lib/Upload.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { getTextFromHTML } from '$lib/utils/functions/course';
  import { createAnnouncement } from '$lib/utils/services/announcement';

  export let mockAnouncements = [];
  export let author = {};
  export let emoji = {};
  export let courseId = '';
  export let id = '';
  // export let generateUniqueId = () => {};
  // export let getCurrentTime = () => {};
  // export let getEmojiPicker = () => {};

  let newAnouncement = '';
  let createdAnnouncement;

  const onPost = async () => {
    if (!newAnouncement) return;

    try {
      const response = await createAnnouncement({
        content: newAnouncement,
        author_id: author.id,
        course_id: courseId
      });

      createdAnnouncement = response.response.data[0];

      console.log('cretaed details 1', createdAnnouncement);
    } catch (error) {
      console.log(error);
    }
    if (!createdAnnouncement) return;
    anouncementList.update((_announcement) => [..._announcement, createdAnnouncement]);
    id = createdAnnouncement.id;
    console.log('creataed details 2', createdAnnouncement);
    mockAnouncements = [
      {
        id: createdAnnouncement.id,
        content: newAnouncement,
        author: {
          id: author.id,
          username: author.username,
          fullname: author.fullname,
          avatar: author.avatar
        },
        created_at: createdAnnouncement.created_at,
        comment: [],
        emoji: emoji
      },
      ...mockAnouncements
    ];
    console.log(author);
    newAnouncement = '';
    $isNewAnouncementModal.open = false;
  };

  const resetEditor = () => {
    newAnouncement.content = '';
    $isNewAnouncementModal.open = false;
  };
</script>

<Modal
  onClose={resetEditor}
  bind:open={$isNewAnouncementModal.open}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading="Make An Anouncement"
>
  <section class="flex flex-col rounded-xl pb-3 h-full">
    <TextEditor
      value={newAnouncement}
      onChange={(text) => {
        newAnouncement = getTextFromHTML(text);
      }}
      placeholder="Make an anouncement to your students"
      maxHeight={200}
    />
    <div class="flex items-center justify-end py-2">
      <div class="flex gap-2">
        <PrimaryButton
          label="Cancel"
          variant={VARIANTS.OUTLINED}
          onClick={() => ($isNewAnouncementModal.open = false)}
        />
        <PrimaryButton label="Post" onClick={onPost} />
      </div>
    </div>
  </section>
</Modal>
