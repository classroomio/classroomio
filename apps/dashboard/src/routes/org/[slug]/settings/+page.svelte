<script lang="ts">
  import { ProfilePage } from '$lib/features/settings/pages';
  import ViewSiteBtn from '$lib/components/Buttons/VisitOrgSite.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let profileComponent: ProfilePage | null = $state(null);
  let isLoading = $state(false);

  async function handleUpdate() {
    isLoading = true;
    try {
      await profileComponent?.handleUpdate();
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.heading')}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <Button variant="secondary" loading={isLoading} onclick={handleUpdate}>
      {$t('settings.profile.update_profile')}
    </Button>

    <ViewSiteBtn />
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <ProfilePage bind:this={profileComponent} />
  {/snippet}
</Page.Body>
