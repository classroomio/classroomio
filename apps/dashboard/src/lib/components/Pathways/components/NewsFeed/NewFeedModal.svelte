<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { isNewFeedModal } from '$lib/components/Pathways/components/NewsFeed/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { createNewFeed } from '$lib/utils/services/pathways/newsfeed/index';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { Feed, Author } from '$lib/utils/types/feed';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { t } from '$lib/utils/functions/translations';
  import { createNewsfeedValidation } from '$lib/utils/functions/validator';
  import { getTextFromHTML } from '$lib/utils/functions/toHtml';

  export let author: Author | any = {};
  export let pathwayId = '';
  export let onSave = (feed: Feed) => {};
  export let onEdit = (id: string, content: string) => {};
  export let edit = false;
  export let editFeed: Feed;

  let newPost = '';
  let isLoading = false;
  let createdFeed;
  let errors = {};

  const onPost = async () => {
    errors = createNewsfeedValidation(getTextFromHTML(newPost));

    if (Object.keys(errors).length) {
      return;
    }
    isLoading = true;
    try {
      if (edit) {
        onEdit(editFeed.id, newPost);
        snackbar.success('snackbar.newsfeed.success.edit');

        edit = false;
        newPost = '';
        $isNewFeedModal.open = false;
      } else {
        const {
          response: { data }
        } = await createNewFeed({
          content: newPost,
          author_id: author.id,
          pathway_id: pathwayId,
          reaction: {
            smile: [],
            thumbsup: [],
            thumbsdown: [],
            clap: []
          }
        });

        console.log('newPost', newPost);
        console.log('author.id', author.id);
        console.log('pathwayId', pathwayId);

        if (!data) return;

        createdFeed = data[0];

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

        snackbar.success('snackbar.newsfeed.success.add');
        triggerSendEmail(NOTIFICATION_NAME.NEWSFEED, {
          authorId: createdFeed.author_id,
          feedId: createdFeed.id
        });
        resetEditor();
      }
    } catch (error) {
      snackbar.error(
        $t('snackbar.newsfeed.error.error') +
          (edit ? $t('snackbar.newsfeed.error.editing') : $t('snackbar.newsfeed.error.creating'))
      );
    } finally {
      isLoading = false;
    }
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
  modalHeading={edit === true
    ? $t('course.navItem.news_feed.heading_button.edit_post')
    : $t('course.navItem.news_feed.heading_button.make_a_post')}
>
  <section class="flex flex-col rounded-xl pb-3 h-full w-2/">
    <TextEditor
      value={newPost}
      onChange={(text) => {
        newPost = text;
      }}
      placeholder={$t('course.navItem.news_feed.heading_button.placeholder')}
      maxHeight={400}
    />
    {#if errors.newPost}
      <p class="text-sm text-red-500">{errors.newPost}</p>
    {/if}
  </section>
  <div slot="buttons" class="flex items-center justify-end py-2">
    <div class="flex gap-2">
      <PrimaryButton
        label={$t('course.navItem.news_feed.heading_button.cancel')}
        variant={VARIANTS.OUTLINED}
        onClick={resetEditor}
      />
      <PrimaryButton
        {isLoading}
        label={$t('course.navItem.news_feed.heading_button.post')}
        onClick={onPost}
      />
    </div>
  </div>
</Modal>
