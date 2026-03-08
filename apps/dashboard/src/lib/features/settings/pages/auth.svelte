<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { t } from '$lib/utils/functions/translations';
  import { licenseApi } from '$features/license/api/license.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { UpgradeBanner } from '$features/ui';

  import AuthGeneral from '../components/auth-general.svelte';
  import AuthSso from '../components/auth-sso.svelte';
  import AuthTokenAuth from '../components/auth-token-auth.svelte';

  const ssoLicensed = $derived(licenseApi.hasAccess('sso'));
  const tokenAuthLicensed = $derived(licenseApi.hasAccess('token-auth'));
  const licenseResolved = $derived(licenseApi.isResolved);

  $effect(() => {
    if (!licenseResolved) {
      return;
    }

    if (currentTab === 'sso' && !ssoLicensed) {
      goto($currentOrgPath + '/settings/auth');
    } else if (currentTab === 'token-auth' && !tokenAuthLicensed) {
      goto($currentOrgPath + '/settings/auth');
    }
  });

  // Determine current tab from URL
  function getTabFromPath(path: string): string {
    if (path.endsWith('/auth/sso')) return 'sso';
    if (path.endsWith('/auth/token-auth')) return 'token-auth';

    return 'general';
  }

  // State for current tab - sync with URL
  let currentTab = $derived(getTabFromPath($page.url.pathname));

  function handleTabChange(value: string) {
    if (value === currentTab) return;

    const basePath = $currentOrgPath + '/settings/auth';

    switch (value) {
      case 'general':
        goto(basePath);
        break;
      case 'sso':
        goto(basePath + '/sso');
        break;
      case 'token-auth':
        goto(basePath + '/token-auth');
        break;
    }
  }
</script>

<UpgradeBanner>{$t('upgrade.enterprise_required')}</UpgradeBanner>

<UnderlineTabs.Root value={currentTab} onValueChange={(e) => handleTabChange(e)}>
  <UnderlineTabs.List class="mb-6">
    <UnderlineTabs.Trigger value="general">
      {$t('settings.auth.tabs.general')}
    </UnderlineTabs.Trigger>
    {#if ssoLicensed}
      <UnderlineTabs.Trigger value="sso">
        {$t('settings.auth.tabs.sso')}
      </UnderlineTabs.Trigger>
    {/if}
    {#if tokenAuthLicensed}
      <UnderlineTabs.Trigger value="token-auth">
        {$t('settings.auth.tabs.token_auth')}
      </UnderlineTabs.Trigger>
    {/if}
  </UnderlineTabs.List>

  <UnderlineTabs.Content value="general">
    <AuthGeneral />
  </UnderlineTabs.Content>

  {#if ssoLicensed}
    <UnderlineTabs.Content value="sso">
      <AuthSso />
    </UnderlineTabs.Content>
  {/if}

  {#if tokenAuthLicensed}
    <UnderlineTabs.Content value="token-auth">
      <AuthTokenAuth />
    </UnderlineTabs.Content>
  {/if}
</UnderlineTabs.Root>
