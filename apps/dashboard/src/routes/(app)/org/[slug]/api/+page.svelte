<script lang="ts">
  import { ApiAutomationPage } from '$features/automation/pages';
  import { automationApi } from '$features/automation/api/automation.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  let { data } = $props();

  $effect(() => {
    if (!data) return;
    automationApi.keys = data.keys;
    automationApi.isFetched = true;
  });
</script>

<svelte:head>
  <title>{t.get('automation.tabs.api')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-4xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('automation.tabs.api')}</Page.Title>
      <Page.Subtitle>{$t('automation.api.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="outline" onclick={() => window.open('https://classroomio.com/docs/api', '_blank')}>
        <ArrowUpRightIcon size={16} />
        {$t('automation.api.view_docs')}
      </Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <ApiAutomationPage />
    {/snippet}
  </Page.Body>
</Page.Root>
