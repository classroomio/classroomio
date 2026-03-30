<script>
  import { Button } from '@cio/ui/base/button';
  import { AudiencePage } from '$features/audience/pages';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPlan, currentOrgMaxAudience } from '$lib/utils/store/org';
  import { PLAN } from '@cio/utils/plans';
  import * as Page from '@cio/ui/base/page';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  let { data } = $props();
  let isLoading = $state(false);

  function exportAudience() {
    isLoading = true;
    alert('This feature is coming soon');
    isLoading = false;
  }

  const audienceLength = $derived(data.pagination?.total || 0);
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
            ({audienceLength} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="outline" onclick={exportAudience} disabled={isLoading} loading={isLoading}>
        {$t('audience.export')}
      </Button>
      <Button variant="secondary" href={resolve(`${page.url.pathname}/import`, {})}>
        {$t('audience.import_users')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AudiencePage audience={data.audience} pagination={data.pagination} query={data.query} courses={data.courses} />
    {/snippet}
  </Page.Body>
</Page.Root>
