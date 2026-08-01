<script lang="ts">
  import { CourseSettingsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
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

  function handleDiscard() {
    settingsComponent?.handleDiscard();
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('course.navItem.settings.heading')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData disabled={isSaving} onRefresh={() => courseApi.refreshCourse(data.courseId, $profile.id)} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CourseSettingsPage bind:this={settingsComponent} bind:hasUnsavedChanges />
    {/snippet}
  </Page.Body>
  <Page.SettingsActions
    hasChanges={hasUnsavedChanges}
    loading={isSaving}
    disabled={isSaving || !hasUnsavedChanges}
    statusLabel={$t('common.unsaved_changes.label')}
    discardLabel={$t('common.discard')}
    saveLabel={$t('common.save_changes')}
    onSave={handleSave}
    onDiscard={handleDiscard}
  />
</Page.Root>
