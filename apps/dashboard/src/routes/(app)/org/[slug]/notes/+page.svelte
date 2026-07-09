<script lang="ts">
  import { NotesWorkspacePage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>{$t('notes.page_title')} - ClassroomIO</title>
</svelte:head>

<NotesWorkspacePage />
