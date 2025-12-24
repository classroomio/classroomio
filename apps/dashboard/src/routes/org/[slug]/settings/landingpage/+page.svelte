<script lang="ts">
  import { LandingpagePage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let landingPageComponent: LandingpagePage | null = $state(null);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await landingPageComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Landing Page Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.landing_page.heading')}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <Button variant="default" loading={isSaving} disabled={isSaving} onclick={handleSave}>
      {$t('settings.landing_page.save_changes')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <LandingpagePage bind:this={landingPageComponent} />
  {/snippet}
</Page.Body>
