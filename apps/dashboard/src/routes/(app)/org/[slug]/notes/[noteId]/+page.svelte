<script lang="ts">
  import { page } from '$app/state';
  import { NotesWorkspacePage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';

  const noteId = $derived(page.params.noteId as string);
</script>

<svelte:head>
  <title>{$t('notes.editor.page_title')} - ClassroomIO</title>
</svelte:head>

<NotesWorkspacePage {noteId} />
