<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { createNewFeed } from '$lib/utils/services/newsfeed';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { Feed, Author } from '$lib/utils/types/feed';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';

  export let author: Author | any = {};
  export let courseId = '';
  export let onSave = (feed: Feed) => {};
  export let onEdit = (id: string, content: string) => {};
  export let edit = false;
  export let editFeed: Feed;

  let newPost = '';
  let createdFeed;

  const onPost = async () => {
    if (!newPost) return;

    // Edit state
    if (edit) {
      onEdit(editFeed.id, newPost);

      snackbar.success('Feed edited successfully');

      edit = false;
      newPost = '';
      $isNewFeedModal.open = false;

      return;
    }

    // Create state
    try {
      const {
        response: { data }
      } = await createNewFeed({
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

      if (!data) return;

      createdFeed = data[0];
    } catch (error) {
      return snackbar.error('An error occurred while creating feed');
    }

    if (!createdFeed) return;

    onSave({
      id: createdFeed.id,
      content: newPost,
      author: {
        profile: { ...author }
      },
      created_at: createdFeed.created_at,
      comment: [],
      reaction: createdFeed.reaction,
      isPinned: false
    });

    snackbar.success('New feed added successfully');
    triggerSendEmail(NOTIFICATION_NAME.NEWSFEED, {
      authorId: createdFeed.author_id,
      feedId: createdFeed.id
    });

    resetEditor();
  };

  const resetEditor = () => {
    newPost = '';
    edit = false;
    $isNewFeedModal.open = false;
  };
  $: newPost = edit === true ? editFeed?.content : '';
</script>

<Modal
  onClose={resetEditor}
  bind:open={$isNewFeedModal.open}
  width="w-4/5"
  maxWidth="max-w-lg"
  modalHeading={edit === true ? 'Edit Post' : 'Make a Post'}
>
  <section class="flex flex-col rounded-xl pb-3 h-full w-2/">
    <TextEditor
      value={newPost}
      onChange={(text) => {
        newPost = text;
      }}
      placeholder="Share an update with your students"
      maxHeight={400}
    />
    <div class="flex items-center justify-end py-2">
      <div class="flex gap-2">
        <PrimaryButton label="Cancel" variant={VARIANTS.OUTLINED} onClick={resetEditor} />
        <PrimaryButton label="Post" onClick={onPost} />
      </div>
    </div>
  </section>
</Modal>
