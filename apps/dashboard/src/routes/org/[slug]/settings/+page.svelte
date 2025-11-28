<script>
  import { ProfilePage } from '$lib/features/settings/pages';
  import ViewSiteBtn from '$lib/components/Buttons/VisitOrgSite.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.heading')}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <ViewSiteBtn />
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <ProfilePage />
  {/snippet}
</Page.Body>
