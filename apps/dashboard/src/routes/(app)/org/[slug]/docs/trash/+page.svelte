<script lang="ts">
  import { DocsWorkspacePage } from '$features/docs/pages';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>{$t('docs.trash.title')} - ClassroomIO</title>
</svelte:head>

<DocsWorkspacePage mode="trash" />
