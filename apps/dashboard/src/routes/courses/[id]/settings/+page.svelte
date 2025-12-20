<script lang="ts">
  import { CourseSettingsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { Button } from '@cio/ui/base/button';

  let { data } = $props();

  let settingsComponent: CourseSettingsPage | null = $state(null);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await settingsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<CourseContainer courseId={data.courseId}>
  <div class="mx-auto w-full max-w-3xl">
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.settings.heading')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <Button variant="secondary" loading={isSaving} onclick={handleSave}>
          {$t('course.navItem.settings.save')}
        </Button>
      </Page.Action>
    </Page.Header>
    <Page.Body>
      {#snippet child()}
        <CourseSettingsPage bind:this={settingsComponent} />
      {/snippet}
    </Page.Body>
  </div>
</CourseContainer>
