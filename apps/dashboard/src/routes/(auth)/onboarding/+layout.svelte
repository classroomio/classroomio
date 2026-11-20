<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import UpgradeModal from '$features/ui/upgrade-modal.svelte';
  import OnboardingSkeleton from '$features/onboarding/components/onboarding-skeleton.svelte';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import { getScreenForPath, isScreenAheadOfSession } from '$features/onboarding/utils/screen';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { ROUTE } from '$lib/utils/constants/routes';

  let { children } = $props();

  let isBootstrapped = $state(false);
  let isReady = $state(false);
  let isRetrying = $state(false);
  let lastViewedStep = '';

  const isRootScreen = $derived(page.url.pathname.replace(/\/$/, '') === ROUTE.ONBOARDING);

  async function enterFlow() {
    await onboardingFlowApi.load();

    const loaded = onboardingFlowApi.state;
    if (!loaded) {
      if (onboardingFlowApi.lastError?.status === 401) {
        await goto(ROUTE.LOGIN, { replaceState: true });
      }

      return;
    }

    if (!loaded.hasSession && loaded.screen !== 'complete') {
      await onboardingFlowApi.start(false);
    }

    const state = onboardingFlowApi.state ?? loaded;
    if (isRootScreen) {
      await onboardingFlowApi.goToScreen();

      return;
    }

    const pathScreen = getScreenForPath(page.url.pathname);
    const isFlowDone = state.screen === 'complete';
    if (pathScreen && (isFlowDone || isScreenAheadOfSession(pathScreen, state.screen))) {
      await onboardingFlowApi.goToScreen();
    }
  }

  $effect(() => {
    if (!isReady) return;

    const step = getScreenForPath(page.url.pathname);
    if (!step || step === lastViewedStep) return;

    lastViewedStep = step;
    const phase = untrack(() => onboardingFlowApi.state?.phase ?? null);
    capturePosthogEvent('onboarding_step_viewed', { step, phase });
  });

  async function retryLoad() {
    isRetrying = true;
    await enterFlow();
    isRetrying = false;
  }

  $effect(() => {
    if (!browser || isBootstrapped) return;

    isBootstrapped = true;
    void enterFlow().finally(() => {
      isReady = true;
    });
  });
</script>

{#if isReady && onboardingFlowApi.state}
  {@render children()}
{:else if isReady && onboardingFlowApi.lastError}
  <div class="flex min-h-screen items-center justify-center px-4">
    <Empty title={$t('onboarding.v2.load_error.title')} description={$t('onboarding.v2.load_error.body')}>
      <Button onclick={retryLoad} loading={isRetrying}>{$t('onboarding.v2.load_error.retry')}</Button>
    </Empty>
  </div>
{:else}
  <OnboardingSkeleton />
{/if}
<UpgradeModal />
