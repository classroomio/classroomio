<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { ProgramNewsfeedItem } from '$features/program/utils/types';
  import { getErrorKey } from '$features/program/utils/error';
  import { programNewsfeedApi } from '$features/program/api';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { TextEditor } from '$features/ui';

  interface Props {
    programId?: string;
    edit?: boolean;
    editFeed: ProgramNewsfeedItem | null;
  }

  let { programId = '', edit = $bindable(false), editFeed = $bindable() }: Props = $props();

  let isLoading = $state(false);
  let newPost = $state('');

  $effect(() => {
    if (edit && editFeed) {
      newPost = editFeed.content || '';
      return;
    }

    if (!programNewsfeedApi.isNewFeedModalOpen) {
      newPost = '';
    }
  });

  const resetEditor = () => {
    newPost = '';
    edit = false;
    editFeed = null;
    programNewsfeedApi.closeNewFeedModal();
  };

  const onPost = async () => {
    isLoading = true;

    try {
      if (edit && editFeed) {
        await programNewsfeedApi.update(programId, editFeed.id, { content: newPost ?? '' });

        if (programNewsfeedApi.success) {
          resetEditor();
        } else {
          snackbar.error(getErrorKey(programNewsfeedApi.error, 'update'));
        }
      } else {
        await programNewsfeedApi.create(programId, {
          content: newPost ?? '',
          isPinned: false
        });

        if (programNewsfeedApi.success) {
          resetEditor();
        } else {
          snackbar.error(getErrorKey(programNewsfeedApi.error, 'create'));
        }
      }
    } catch {
      snackbar.error(getErrorKey(programNewsfeedApi.error, edit ? 'update' : 'create'));
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog.Root
  bind:open={programNewsfeedApi.isNewFeedModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      resetEditor();
    }
  }}
>
  <Dialog.Content class="h-fit! w-fit! max-w-none!">
    <Dialog.Header>
      <Dialog.Title>
        {edit ? $t('programs.newsfeed.edit_post') : $t('programs.newsfeed.make_a_post')}
      </Dialog.Title>
    </Dialog.Header>
    <section class="max-w-lg">
      <TextEditor
        content={newPost || editFeed?.content || ''}
        onChange={(text) => {
          newPost = text;
        }}
        editorClass="max-h-[400px]"
        placeholder={$t('programs.newsfeed.editor_placeholder')}
      />
    </section>
    <Dialog.Footer>
      <Button variant="outline" onclick={resetEditor}>
        {$t('programs.newsfeed.cancel')}
      </Button>
      <Button loading={isLoading} onclick={onPost}>
        {$t('programs.newsfeed.post_submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
