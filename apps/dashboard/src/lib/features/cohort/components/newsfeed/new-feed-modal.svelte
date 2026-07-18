<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CohortNewsfeedItem } from '$features/cohort/utils/types';
  import { getErrorKey } from '$features/cohort/utils/error';
  import { cohortNewsfeedApi } from '$features/cohort/api';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { TextEditor } from '$features/ui';

  interface Props {
    cohortId?: string;
    edit?: boolean;
    editFeed: CohortNewsfeedItem | null;
  }

  let { cohortId = '', edit = $bindable(false), editFeed = $bindable() }: Props = $props();

  let isLoading = $state(false);
  let newPost = $state('');

  $effect(() => {
    if (!cohortNewsfeedApi.isNewFeedModalOpen) {
      return;
    }

    if (edit && editFeed) {
      newPost = editFeed.content || '';
      return;
    }

    newPost = '';
  });

  const resetEditor = () => {
    newPost = '';
    edit = false;
    editFeed = null;
    cohortNewsfeedApi.closeNewFeedModal();
  };

  const onPost = async () => {
    isLoading = true;

    try {
      if (edit && editFeed) {
        await cohortNewsfeedApi.update(cohortId, editFeed.id, { content: newPost ?? '' });

        if (cohortNewsfeedApi.success) {
          resetEditor();
        } else {
          snackbar.error(getErrorKey(cohortNewsfeedApi.error, 'update'));
        }
      } else {
        await cohortNewsfeedApi.create(cohortId, {
          content: newPost ?? '',
          isPinned: false
        });

        if (cohortNewsfeedApi.success) {
          resetEditor();
        } else {
          snackbar.error(getErrorKey(cohortNewsfeedApi.error, 'create'));
        }
      }
    } catch {
      snackbar.error(getErrorKey(cohortNewsfeedApi.error, edit ? 'update' : 'create'));
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog.Root
  bind:open={cohortNewsfeedApi.isNewFeedModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      resetEditor();
    }
  }}
>
  <Dialog.Content class="h-fit! w-fit! max-w-none!">
    <Dialog.Header>
      <Dialog.Title>
        {edit ? $t('cohorts.newsfeed.edit_post') : $t('cohorts.newsfeed.make_a_post')}
      </Dialog.Title>
    </Dialog.Header>
    <section class="max-w-lg">
      {#key edit ? editFeed?.id : 'new'}
        <TextEditor
          content={newPost}
          onChange={(text) => {
            newPost = text;
          }}
          editorClass="max-h-[400px]"
          placeholder={$t('cohorts.newsfeed.editor_placeholder')}
        />
      {/key}
    </section>
    <Dialog.Footer>
      <Button variant="outline" onclick={resetEditor}>
        {$t('cohorts.newsfeed.cancel')}
      </Button>
      <Button loading={isLoading} onclick={onPost}>
        {$t('cohorts.newsfeed.post_submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
