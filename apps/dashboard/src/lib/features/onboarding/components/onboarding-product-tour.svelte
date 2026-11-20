<script lang="ts">
  import { ProductTour, type ProductTourFinishReason, type ProductTourStep } from '@cio/ui/custom/product-tour';
  import { ONBOARDING_TOUR_STEP_IDS, type TOnboardingTourStepId } from '@cio/utils/constants/onboarding';
  import { appInitApi } from '$features/app/init.svelte';
  import { authClient } from '$lib/utils/services/auth/client';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import { TOUR_STEP_DEFINITIONS } from '$features/onboarding/utils/tour-steps';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { OnboardingTourUpdateInput } from '$features/onboarding/utils/types';

  let isFinished = $state(false);
  let lastCompletedStepId = $state<TOnboardingTourStepId | null>(null);
  let tourUpdateQueue: Promise<unknown> = Promise.resolve();

  const session = authClient.useSession();
  const onboarding = $derived(appInitApi.data?.success ? (appInitApi.data.onboarding ?? null) : null);
  const isEmailVerified = $derived(Boolean($profile.isEmailVerified || $session.data?.user?.emailVerified));
  const isTourActive = $derived(
    !isFinished && onboarding?.phase === 'complete' && onboarding.tourStatus === 'active' && isEmailVerified
  );
  const completedStepIds = $derived(onboardingFlowApi.state?.tour.completedStepIds ?? []);
  const isReady = $derived(isTourActive && onboardingFlowApi.state !== null);

  const steps = $derived<ProductTourStep[]>(
    TOUR_STEP_DEFINITIONS.map((definition) => ({
      id: definition.id,
      target: definition.target,
      advanceOnTargetClick: definition.advanceOnTargetClick,
      title: $t(`onboarding.v2.tour.steps.${definition.id}.title`),
      body: $t(`onboarding.v2.tour.steps.${definition.id}.body`),
      hint: definition.advanceOnTargetClick ? $t('onboarding.v2.tour.hint_click') : undefined
    }))
  );

  const labels = $derived({
    counter: (position: number, total: number) =>
      $t('onboarding.v2.tour.counter', { position: String(position), total: String(total) }),
    next: $t('onboarding.v2.tour.next'),
    back: $t('onboarding.v2.tour.back'),
    done: $t('onboarding.v2.tour.done'),
    skip: $t('onboarding.v2.tour.skip'),
    region: $t('onboarding.v2.tour.region')
  });

  $effect(() => {
    if (!isTourActive || onboardingFlowApi.state) return;

    void onboardingFlowApi.load();
  });

  function isTourStepId(stepId: string): stepId is TOnboardingTourStepId {
    return (ONBOARDING_TOUR_STEP_IDS as readonly string[]).includes(stepId);
  }

  function setLocalTourStatus(status: 'completed' | 'dismissed') {
    if (!appInitApi.data?.success || !appInitApi.data.onboarding) return;

    appInitApi.data.onboarding.tourStatus = status;
  }

  function queueTourUpdate(update: OnboardingTourUpdateInput) {
    tourUpdateQueue = tourUpdateQueue.then(() => onboardingFlowApi.updateTour(update)).catch(() => undefined);

    return tourUpdateQueue;
  }

  function handleStepComplete(stepId: string) {
    if (!isTourStepId(stepId)) return;

    lastCompletedStepId = stepId;
    void queueTourUpdate({ completedStepId: stepId });
  }

  function handleFinish(reason: ProductTourFinishReason) {
    const status = reason === 'done' ? 'completed' : 'dismissed';

    isFinished = true;
    setLocalTourStatus(status);
    void queueTourUpdate({
      status,
      ...(status === 'completed' && lastCompletedStepId ? { completedStepId: lastCompletedStepId } : {})
    });
  }
</script>

<ProductTour
  {steps}
  {labels}
  {completedStepIds}
  open={isReady}
  onStepComplete={handleStepComplete}
  onFinish={handleFinish}
/>
