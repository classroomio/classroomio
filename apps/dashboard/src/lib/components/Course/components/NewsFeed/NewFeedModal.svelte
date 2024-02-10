<script>
  // @ts-nocheck
  import Modal from '$lib/components/Modal/index.svelte';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { getTextFromHTML } from '$lib/utils/functions/course';
  import { createNewFeed } from '$lib/utils/services/newsfeed';
  import { snackbar } from '$lib/components/Snackbar/store';

  export let author = {};
  export let courseId = '';
  export let onSave = () => {};

  let newPost = '';
  let createdFeed;

  const onPost = async () => {
    if (!newPost) return;

    try {
      const response = await createNewFeed({
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
    } catch (error) {
      return snackbar.error('An error occurred while creating feed');
    }
    if (!createdFeed) return;

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

    newPost = '';
    $isNewFeedModal.open = false;
  };

  const resetEditor = () => {
    newPost = '';
    $isNewFeedModal.open = false;
  };
</script>

<Modal
  onClose={resetEditor}
  bind:open={$isNewFeedModal.open}
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
          onClick={() => ($isNewFeedModal.open = false)}
        />
        <PrimaryButton label="Post" onClick={onPost} />
      </div>
    </div>
  </section>
</Modal>
