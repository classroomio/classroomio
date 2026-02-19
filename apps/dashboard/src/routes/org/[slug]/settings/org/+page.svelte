<script lang="ts">
  import { OrgPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let orgComponent: OrgPage | null = $state(null);
  let loading = $state(false);

  async function handleUpdate() {
    loading = true;
    try {
      await orgComponent?.handleUpdate();
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Organization Settings - ClassroomIO</title>
</svelte:head>

<Page.Header isSticky>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.organization.organization_profile.heading')}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <Button variant="default" {loading} disabled={loading} onclick={handleUpdate}>
      {$t('settings.organization.organization_profile.update_organization')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <OrgPage bind:this={orgComponent} />
  {/snippet}
</Page.Body>
