<script>
  import { Button } from '@cio/ui/base/button';
  import { AudiencePage } from '$lib/features/audience/pages';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPlan, currentOrgMaxAudience } from '$lib/utils/store/org';
  import { PLAN } from '@cio/utils/plans';
  import * as Page from '@cio/ui/base/page';
  import { orgApi } from '$lib/features/org/api/org.svelte';

  let isLoading = $state(false);

  function exportAudience() {
    isLoading = true;
    alert('This feature is coming soon');
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('audience.title')}
        {#if $currentOrgPlan?.planName !== PLAN.ENTERPRISE}
          <span class="ml-2 text-sm">
            ({orgApi.audience.length} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button onclick={exportAudience} disabled={isLoading} loading={isLoading}>
        {$t('audience.export')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AudiencePage />
    {/snippet}
  </Page.Body>
</Page.Root>
