<script lang="ts">
  import { CourseSettingsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { RefreshPageData } from '$features/ui';

  let settingsComponent: CourseSettingsPage | null = $state(null);
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);
  let { data } = $props();

  async function handleSave() {
    isSaving = true;
    try {
      await settingsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header class="sticky top-13 z-10 bg-white">
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.settings.heading')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        <Button variant="secondary" loading={isSaving} disabled={isSaving || !hasUnsavedChanges} onclick={handleSave}>
          {$t('course.navItem.settings.save')}
        </Button>
        <RefreshPageData disabled={isSaving} onRefresh={() => courseApi.refreshCourse(data.courseId, $profile.id)} />
      </div>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CourseSettingsPage bind:this={settingsComponent} bind:hasUnsavedChanges />
    {/snippet}
  </Page.Body>
</Page.Root>
