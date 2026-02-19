<script lang="ts">
  import { CourseSettingsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';

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

<Page.Header class="sticky top-13 z-10 bg-white">
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
