<script lang="ts">
  import { McpAutomationPage } from '$features/automation/pages';
  import { automationApi } from '$features/automation/api/automation.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  let { data } = $props();

  $effect(() => {
    if (!data) return;
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
      <Page.Subtitle>{$t('automation.mcp.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button
        variant="outline"
        href="https://classroomio.com/docs/mcp"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ArrowUpRightIcon size={16} />
        {$t('automation.mcp.view_docs')}
      </Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <McpAutomationPage />
    {/snippet}
  </Page.Body>
</Page.Root>
