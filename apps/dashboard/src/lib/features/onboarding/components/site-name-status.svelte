<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { ZOnboardingCreateOrg } from '@cio/utils/validation/onboarding';
  import { SITE_NAME_CHECK_DEBOUNCE_MS } from '@cio/utils/constants/onboarding';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';

  interface Props {
    siteName: string;
  }

  let { siteName }: Props = $props();

  const isLocallyValid = $derived(ZOnboardingCreateOrg.shape.siteName.safeParse(siteName).success);

  const check = $derived(onboardingFlowApi.siteNameCheck);

  $effect(() => {
    const value = siteName;

    onboardingFlowApi.clearSiteNameCheck();
    if (!value || !isLocallyValid) return;

    const timer = setTimeout(() => void onboardingFlowApi.checkSiteName(value), SITE_NAME_CHECK_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  });
</script>

<div class="ui:text-muted-foreground flex min-h-5 items-center gap-2 text-xs" aria-live="polite">
  {#if onboardingFlowApi.isCheckingSiteName && siteName}
    <LoaderCircleIcon class="custom size-3.5 animate-spin" />
    <span>{$t('onboarding.v2.workspace.checking')}</span>
  {:else if check && check.siteName === siteName}
    {#if check.available}
      <CheckIcon class="ui:text-primary custom size-3.5" />
      <span class="ui:text-primary">{$t('onboarding.v2.workspace.available')}</span>
    {:else}
      <XIcon class="ui:text-destructive custom size-3.5" />
      <span class="ui:text-destructive">{$t(check.message)}</span>
    {/if}
  {/if}
</div>
