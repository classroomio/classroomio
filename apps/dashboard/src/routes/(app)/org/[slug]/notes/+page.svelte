<script lang="ts">
  import { OrgNotesPage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{$t('notes.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full max-w-none">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('notes.heading')}</Page.Title>
      <Page.Subtitle>{$t('notes.org_description')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <OrgNotesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
