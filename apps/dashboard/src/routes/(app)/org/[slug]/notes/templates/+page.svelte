<script lang="ts">
  import { NotesWorkspacePage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>{$t('notes.templates.page_title')} - ClassroomIO</title>
</svelte:head>

<NotesWorkspacePage mode="templates" />
