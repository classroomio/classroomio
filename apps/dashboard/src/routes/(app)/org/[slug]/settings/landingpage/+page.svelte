<script lang="ts">
  import { LandingpagePage } from '$features/settings/pages';
  import { VisitOrgSiteButton } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let landingPageComponent: LandingpagePage | null = $state(null);
  let hasUnsavedChanges = $state(false);
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

<Page.Header isSticky>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.landing_page.heading')}</Page.Title>
    <Page.Subtitle>{$t('settings.landing_page.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <VisitOrgSiteButton labelKey="markdown_editor.preview" variant="secondary" />

    <Button variant="default" loading={isSaving} disabled={isSaving || !hasUnsavedChanges} onclick={handleSave}>
      {$t('settings.landing_page.save_changes')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <LandingpagePage bind:this={landingPageComponent} bind:hasUnsavedChanges />
  {/snippet}
</Page.Body>
