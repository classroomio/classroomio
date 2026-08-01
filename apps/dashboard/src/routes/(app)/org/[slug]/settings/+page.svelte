<script lang="ts">
  import { ProfilePage } from '$features/settings/pages';
  import { VisitOrgSiteButton } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  let profileComponent: ProfilePage | null = $state(null);
  let isLoading = $state(false);
  let hasUnsavedChanges = $state(false);

  async function handleUpdate() {
    isLoading = true;
    try {
      await profileComponent?.handleUpdate();
    } finally {
      isLoading = false;
    }
  }

  function handleDiscard() {
    profileComponent?.handleDiscard();
  }
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.profile.heading')}</Page.Title>
    <Page.Subtitle>{$t('settings.profile.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <VisitOrgSiteButton />
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <ProfilePage bind:this={profileComponent} bind:hasUnsavedChanges />
  {/snippet}
</Page.Body>
<Page.SettingsActions
  hasChanges={hasUnsavedChanges}
  loading={isLoading}
  statusLabel={$t('common.unsaved_changes.label')}
  discardLabel={$t('common.discard')}
  saveLabel={$t('common.save_changes')}
  onSave={handleUpdate}
  onDiscard={handleDiscard}
/>
