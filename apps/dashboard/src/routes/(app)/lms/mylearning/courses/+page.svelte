<script lang="ts">
  import { MyCoursesPage } from '$features/learning-path/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>My Courses - My Learning</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.my_learning.heading_courses')}</Page.Title>
      <Page.Subtitle>{$t('learningPath.my_learning.courses_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <MyCoursesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
