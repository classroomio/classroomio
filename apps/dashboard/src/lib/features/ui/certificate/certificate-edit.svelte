<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { t } from '$lib/utils/functions/translations';
  import { UpgradeBanner } from '$features/ui';

  interface Props {
    activeTab?: string;
    onActiveTabChange?: (tab: string) => void;
    designSnippet?: Snippet;
    settingsSnippet?: Snippet;
  }

  let { activeTab = 'design', onActiveTabChange, designSnippet, settingsSnippet }: Props = $props();
</script>

<UpgradeBanner>{$t('upgrade.certificate')}</UpgradeBanner>

<main class="px-2 md:-mr-3 md:-ml-3">
  <UnderlineTabs.Root value={activeTab} onValueChange={(value) => onActiveTabChange?.(value)} class="w-full">
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="design">
        {$t('certificate.tab_design')}
      </UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="settings">
        {$t('certificate.tab_settings')}
      </UnderlineTabs.Trigger>
    </UnderlineTabs.List>
    <UnderlineTabs.Content value="design" class="mt-4">
      {@render designSnippet?.()}
    </UnderlineTabs.Content>
    <UnderlineTabs.Content value="settings" class="mt-4">
      {@render settingsSnippet?.()}
    </UnderlineTabs.Content>
  </UnderlineTabs.Root>
</main>
