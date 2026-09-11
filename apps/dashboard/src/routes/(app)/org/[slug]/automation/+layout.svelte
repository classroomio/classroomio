<script lang="ts">
  import { page } from '$app/state';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
  const tabs = [
    { key: 'automation.tabs.mcp', path: 'mcp' },
    { key: 'automation.tabs.api', path: 'api' },
    { key: 'automation.tabs.zapier', path: 'zapier' }
  ];
  const activePath = $derived(page.url.pathname.split('/').pop() ?? 'mcp');
</script>

<div class="mx-auto w-full max-w-4xl">
  <nav class="mb-6 flex gap-1 border-b" aria-label={t.get('org_navigation.automation')}>
    {#each tabs as tab (tab.path)}
      <a
        href={`${$currentOrgPath}/automation/${tab.path}`}
        class:active={activePath === tab.path}
        class="border-b-2 border-transparent px-4 py-2 text-sm font-medium">{t.get(tab.key)}</a
      >
    {/each}
  </nav>
  {@render children?.()}
</div>

<style>
  a.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
</style>
