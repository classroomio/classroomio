<script lang="ts">
  import { Button, type ButtonVariant } from '@cio/ui/base/button';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  interface Props {
    className?: string;
    isLMS?: boolean;
    labelKey?: string;
    variant?: ButtonVariant;
  }

  let {
    className = '',
    isLMS = false,
    labelKey = 'settings.subheadings.view_site',
    variant = 'default'
  }: Props = $props();

  let href = $derived(isLMS && $user.isLoggedIn ? `${$currentOrgDomain}/home` : $currentOrgDomain);
</script>

<Button {href} target="_blank" {variant} class={`ml-2 ${className}`.trim()}>
  {#if !$isMobile}
    {#if isLMS}
      {$t('dashboard.visit_site')}
    {:else}
      {$t(labelKey)}
    {/if}
  {/if}
  <ArrowUpRightIcon class="custom" />
</Button>
