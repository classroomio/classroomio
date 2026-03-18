<script lang="ts">
  import { McpAutomationPage } from '$features/automation/pages';
  import { automationApi } from '$features/automation/api/automation.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';

  let { data } = $props();

  $effect(() => {
    if (!data || automationApi.isFetched) return;
    automationApi.keys = data.keys;
    automationApi.usage = data.usage;
    automationApi.isFetched = true;
  });
</script>

<svelte:head>
  <title>{t.get('automation.tabs.mcp')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-4xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('automation.tabs.mcp')}</Page.Title>
      <Page.Subtitle>{$t('automation.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <McpAutomationPage />
    {/snippet}
  </Page.Body>
</Page.Root>
