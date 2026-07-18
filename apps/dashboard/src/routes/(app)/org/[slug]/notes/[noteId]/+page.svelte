<script lang="ts">
  import { page } from '$app/state';
  import { NoteEditorPage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  const noteId = $derived(page.params.noteId as string);
</script>

<svelte:head>
  <title>{$t('notes.editor.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full max-w-none">
  <Page.Body class="pt-0">
    {#snippet child()}
      <NoteEditorPage {noteId} />
    {/snippet}
  </Page.Body>
</Page.Root>
