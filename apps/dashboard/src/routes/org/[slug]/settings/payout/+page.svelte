<script>
  import { PayoutPage } from '$features/settings/pages';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Payout Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>Payout Settings</Page.Title>
    <Page.Description>Manage how you receive payments from course sales</Page.Description>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <PayoutPage />
  {/snippet}
</Page.Body>
