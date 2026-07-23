<script lang="ts">
  import { page } from '$app/state';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { t } from '$lib/utils/functions/translations';

  import { UpgradeBanner } from '$features/ui';

  import CertificateDesign from './certificate-design.svelte';
  import CertificateSettings from './certificate-settings.svelte';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  let activeTab = $state('design');
  let highlightActive = $state(false);

  // Initialize activeTab and highlight from URL parameter if present
  $effect(() => {
    const tabParam = page.url.searchParams.get('tab');
    if (tabParam && (tabParam === 'design' || tabParam === 'settings')) {
      activeTab = tabParam;
    }

    const highlightParam = page.url.searchParams.get('highlight');
    if (highlightParam === 'true') {
      highlightActive = true;
    }
  });
</script>

<UpgradeBanner>{$t('upgrade.certificate')}</UpgradeBanner>

<main class="px-2 md:-mr-3 md:-ml-3">
  <UnderlineTabs.Root bind:value={activeTab} class="w-full">
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="design">
        {$t('course.navItem.certificates.tab_design')}
      </UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="settings">
        {$t('course.navItem.certificates.tab_settings')}
      </UnderlineTabs.Trigger>
    </UnderlineTabs.List>
    <UnderlineTabs.Content value="design" class="mt-4">
      <CertificateDesign {errors} />
    </UnderlineTabs.Content>
    <UnderlineTabs.Content value="settings" class="mt-4">
      <CertificateSettings {errors} bind:highlightActive />
    </UnderlineTabs.Content>
  </UnderlineTabs.Root>
</main>
