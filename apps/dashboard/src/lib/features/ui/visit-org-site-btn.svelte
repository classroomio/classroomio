<script lang="ts">
  import { browser } from '$app/environment';
  import { Button, type ButtonVariant } from '@cio/ui/base/button';
  import SquareArrowOutUpRight from '@lucide/svelte/icons/square-arrow-out-up-right';

  import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  interface Props {
    className?: string;
    isLMS?: boolean;
    labelKey?: string;
    variant?: ButtonVariant;
    forceSubdomain?: boolean;
  }

  let {
    className = '',
    isLMS = false,
    labelKey = 'settings.subheadings.view_site',
    variant = 'default',
    forceSubdomain = false
  }: Props = $props();

  let href = $derived.by(() => {
    const subdomainOrigin = $currentOrg.siteName ? `https://${$currentOrg.siteName}.${TENANT_ROOT_DOMAIN}` : '';
    const origin = forceSubdomain
      ? subdomainOrigin || (browser ? window.location.origin : '')
      : $currentOrgDomain || (browser ? window.location.origin : '');

    if (!origin) {
      return '';
    }

    const pathname = isLMS && $user.isLoggedIn ? '/home' : '/';
    const url = new URL(pathname, origin);

    if (browser && window.location.host.includes('localhost') && $currentOrg.siteName) {
      url.searchParams.set('org', $currentOrg.siteName);
    }

    return url.toString();
  });
</script>

<Button {href} target="_blank" {variant} class={`&_span:hidden! md:&_span:block ml-2 ${className}`.trim()}>
  {#if !$isMobile}
    <span>
      {#if isLMS}
        {$t('dashboard.visit_site')}
      {:else}
        {$t(labelKey)}
      {/if}
    </span>
  {/if}
  <SquareArrowOutUpRight class="custom" />
</Button>
