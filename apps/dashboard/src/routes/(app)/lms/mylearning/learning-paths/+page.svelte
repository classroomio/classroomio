<script lang="ts">
  import { LearningPathsPage } from '$features/learning-path/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Learning Paths - My Learning</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.my_learning.heading_learning_paths')}</Page.Title>
      <Page.Subtitle>{$t('learningPath.my_learning.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <LearningPathsPage />
    {/snippet}
  </Page.Body>
</Page.Root>
