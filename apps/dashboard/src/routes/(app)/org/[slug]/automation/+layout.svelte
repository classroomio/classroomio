<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();

  const tabs = [
    { value: 'mcp', href: '/automation/mcp', label: 'automation.tabs.mcp' },
    { value: 'api', href: '/automation/api', label: 'automation.tabs.api' },
    { value: 'zapier', href: '/automation/zapier', label: 'automation.tabs.zapier' }
  ] as const;

  function getCurrentTab(pathname: string) {
    if (pathname.endsWith('/automation/mcp')) return 'mcp';
    if (pathname.endsWith('/automation/api')) return 'api';
    if (pathname.endsWith('/automation/zapier')) return 'zapier';
    return 'mcp';
  }

  let currentTab = $derived(getCurrentTab(page.url.pathname));

  function handleTabChange(value: string) {
    const nextTab = tabs.find((tab) => tab.value === value);
    if (!nextTab || value === currentTab) return;
    goto($currentOrgPath + nextTab.href);
  }
</script>

<div class="mx-auto mt-4 w-full max-w-4xl">
  <div class="mb-2 px-2">
    <UnderlineTabs.Root value={currentTab} onValueChange={(event) => handleTabChange(event)}>
      <UnderlineTabs.List class="flex flex-wrap gap-2 border-b">
        {#each tabs as tab}
          <UnderlineTabs.Trigger value={tab.value}>
            {$t(tab.label)}
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>
    </UnderlineTabs.Root>
  </div>
  {@render children?.()}
</div>
