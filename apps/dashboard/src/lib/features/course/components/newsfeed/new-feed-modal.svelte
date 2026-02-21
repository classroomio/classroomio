<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { Feed } from '$features/course/utils/types';
  import { newsfeedApi } from '$features/course/api';
  import { Button } from '@cio/ui/base/button';

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
    isLoading = true;

    try {
      if (edit && editFeed) {
        await newsfeedApi.update(courseId, editFeed.id, { content: newPost ?? '' });

        if (newsfeedApi.success) {
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

        if (newsfeedApi.success) {
          resetEditor();
        }
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
  <Dialog.Content class="h-fit! w-fit! max-w-none!">
    <Dialog.Header>
      <Dialog.Title>
        {edit === true
          ? $t('course.navItem.news_feed.heading_button.edit_post')
          : $t('course.navItem.news_feed.heading_button.make_a_post')}
      </Dialog.Title>
    </Dialog.Header>
    <section class="max-w-lg">
      <TextEditor
        content={newPost || editFeed?.content || ''}
        onChange={(text) => {
          newPost = text;
        }}
        editorClass="max-h-[400px]"
        placeholder={$t('course.navItem.news_feed.heading_button.placeholder')}
      />
      {#if errors.newPost}
        <p class="text-sm text-red-500">{errors.newPost}</p>
      {/if}
    </section>
    <Dialog.Footer>
      <Button variant="outline" onclick={resetEditor}>
        {$t('course.navItem.news_feed.heading_button.cancel')}
      </Button>
      <Button loading={isLoading} onclick={onPost}>
        {$t('course.navItem.news_feed.heading_button.post')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
