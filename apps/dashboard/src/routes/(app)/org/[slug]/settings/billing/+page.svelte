<script>
  import { BillingPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Billing - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.billing.sub_title')}</Page.Title>
    <Page.Subtitle>{$t('settings.billing.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <BillingPage />
  {/snippet}
</Page.Body>
