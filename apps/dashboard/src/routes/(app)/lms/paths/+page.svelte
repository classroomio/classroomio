<script lang="ts">
  import { LearningPathsPage } from '$features/learning-path/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Learning Paths - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.legacy.title')}</Page.Title>
      <Page.Subtitle>{$t('learningPath.legacy.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <LearningPathsPage />
    {/snippet}
  </Page.Body>
</Page.Root>
