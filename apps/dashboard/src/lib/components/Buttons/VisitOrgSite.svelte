<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  interface Props {
    className?: string;
    isLMS?: boolean;
  }

  let { className = '', isLMS = false }: Props = $props();

  let href = $derived(isLMS && $user.isLoggedIn ? `${$currentOrgDomain}/home` : $currentOrgDomain);
</script>

<a {href} target="_blank" class="{className} ml-2 hover:no-underline">
  <PrimaryButton variant={VARIANTS.CONTAINED_DARK}>
    {#if !$isMobile}
      {#if isLMS}
        {$t('dashboard.visit_site')}
      {:else}
        {$t('settings.subheadings.view_site')}
      {/if}
    {/if}
    <ArrowUpRightIcon />
  </PrimaryButton>
</a>
