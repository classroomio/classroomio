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

  import { getTextFromHTML } from '$lib/utils/functions/course';
  import { createAnnouncement } from '$lib/utils/services/announcement';
  import { snackbar } from '$lib/components/Snackbar/store';

  export let author = {};
  export let courseId = '';
  export let onSave = () => {};

  let newPost = '';
  let createdFeed;

  const onPost = async () => {
    if (!newPost) return;

    try {
      const response = await createAnnouncement({
        content: newPost,
        author_id: author.id,
        course_id: courseId,
        reaction: {
          smile: [],
          thumbsup: [],
          thumbsdown: [],
          clap: []
        }
      });

      createdFeed = response.response.data[0];

      console.log('cretaed details 1', createdFeed);
    } catch (error) {
      console.log(error);
      return snackbar.error('An error occurred while creating feed');
    }
    if (!createdFeed) return;

    console.log('creataed details 2', createdFeed);

    onSave({
      id: createdFeed.id,
      content: newPost,
      author: {
        id: author.id,
        username: author.username,
        fullname: author.fullname,
        avatar: author.avatar
      },
      created_at: createdFeed.created_at,
      comment: [],
      reaction: createdFeed.reaction
    });

    console.log(author);

    newPost = '';
    $isNewAnouncementModal.open = false;
  };

  const resetEditor = () => {
    newPost = '';
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
      value={newPost}
      onChange={(text) => {
        newPost = getTextFromHTML(text);
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
