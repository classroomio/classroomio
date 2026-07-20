<script lang="ts">
  import { page } from '$app/state';
  import { DocsWorkspacePage } from '$features/docs/pages';
  import { t } from '$lib/utils/functions/translations';

  const docId = $derived(page.params.docId as string);
</script>

<svelte:head>
  <title>{$t('docs.editor.page_title')} - ClassroomIO</title>
</svelte:head>

<DocsWorkspacePage {docId} />
