<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { Feed } from '$features/course/utils/types';
  import { getTextFromHTML } from '$lib/utils/functions/toHtml';
  import { newsfeedApi } from '$features/course/api';
  import { Button } from '@cio/ui/base/button';
  import { createNewsfeedValidation } from '$lib/utils/functions/validator';

  import * as Dialog from '@cio/ui/base/dialog';
  import { TextEditor } from '$features/ui';

  interface Props {
    courseId?: string;
    edit?: boolean;
    editFeed: Feed | null;
  }

  let { courseId = '', edit = $bindable(false), editFeed = $bindable() }: Props = $props();

  let isLoading = $state(false);
  let errors: Record<string, string> = $state({
    newPost: ''
  });

  let newPost = $state(edit === true ? editFeed?.content : '');

  const onPost = async () => {
    errors = createNewsfeedValidation(getTextFromHTML(newPost ?? ''));

    if (Object.keys(errors).length || !editFeed) {
      return;
    }

    isLoading = true;

    try {
      if (edit && editFeed) {
        await newsfeedApi.update(courseId, editFeed.id, { content: newPost ?? '' });

        if (newsfeedApi.success) {
          snackbar.success('snackbar.newsfeed.success.edit');

          edit = false;
          newPost = '';
          newsfeedApi.closeNewFeedModal();
        }
      } else {
        await newsfeedApi.create(courseId, {
          courseId,
          content: newPost ?? '',
          isPinned: false
        });

        if (!newsfeedApi.success) {
          return;
        }

        snackbar.success('snackbar.newsfeed.success.add');

        resetEditor();
      }
    } catch (error) {
      snackbar.error(
        'snackbar.newsfeed.error.error ' +
          (edit ? 'snackbar.newsfeed.error.editing' : 'snackbar.newsfeed.error.creating')
      );
    } finally {
      isLoading = false;
    }
  };

  const resetEditor = () => {
    newPost = '';
    edit = false;
    newsfeedApi.closeNewFeedModal();
  };
</script>

<Dialog.Root
  bind:open={newsfeedApi.isNewFeedModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      newsfeedApi.closeNewFeedModal();
      resetEditor();
    }
  }}
>
  <Dialog.Content class="w-4/5 max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {edit === true
          ? $t('course.navItem.news_feed.heading_button.edit_post')
          : $t('course.navItem.news_feed.heading_button.make_a_post')}
      </Dialog.Title>
    </Dialog.Header>
    <section class="w-2/ flex h-full flex-col rounded-xl pb-3">
      <TextEditor
        content={newPost || ''}
        onChange={(text) => {
          newPost = text;
        }}
        editorClass="max-h-[400px]"
        placeholder={$t('course.navItem.news_feed.heading_button.placeholder')}
      />
      {#if errors.newPost}
        <p class="text-sm text-red-500">{errors.newPost}</p>
      {/if}
      <div class="flex items-center justify-end py-2">
        <div class="flex gap-2">
          <Button variant="outline" onclick={resetEditor}>
            {$t('course.navItem.news_feed.heading_button.cancel')}
          </Button>
          <Button loading={isLoading} onclick={onPost}>
            {$t('course.navItem.news_feed.heading_button.post')}
          </Button>
        </div>
      </div>
    </section>
  </Dialog.Content>
</Dialog.Root>
