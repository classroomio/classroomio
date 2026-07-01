<script lang="ts">
  import { MyNotesPage } from '$features/notes/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>{$t('notes.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('notes.heading')}</Page.Title>
      <Page.Subtitle>{$t('notes.description')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <MyNotesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
