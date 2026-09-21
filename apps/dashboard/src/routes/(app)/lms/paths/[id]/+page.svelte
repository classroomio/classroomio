<script lang="ts">
  import { PathDetailPage } from '$features/learning-path/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Learning Path - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.badge.learning_path')}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <PathDetailPage />
    {/snippet}
  </Page.Body>
</Page.Root>
