<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { appInitApi } from '$features/app/init.svelte';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { authClient } from '$lib/utils/services/auth/client';

  interface Props {
    hasCourses: boolean;
  }

  let { hasCourses }: Props = $props();

  let isClosed = $state(false);

  const session = authClient.useSession();
  const isEmailVerified = $derived(Boolean($profile.isEmailVerified || $session.data?.user?.emailVerified));
  const onboarding = $derived(appInitApi.data?.success ? (appInitApi.data.onboarding ?? null) : null);
  const open = $derived(
    !isClosed && onboarding?.phase === 'complete' && onboarding.tourStatus === 'pending' && isEmailVerified
  );

  function setLocalTourStatus(status: 'active' | 'dismissed') {
    if (!appInitApi.data?.success || !appInitApi.data.onboarding) return;

    appInitApi.data.onboarding.tourStatus = status;
  }

  async function handleLater() {
    isClosed = true;
    setLocalTourStatus('dismissed');
    await onboardingFlowApi.updateTour({ status: 'dismissed' });
  }

  async function handleTakeTour() {
    isClosed = true;
    setLocalTourStatus('active');
    await onboardingFlowApi.updateTour({ status: 'active' });
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) void handleLater();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content data-testid="onboarding-welcome-dialog">
    <Dialog.Header>
      <Dialog.Title>{$t('onboarding.v2.welcome.title')}</Dialog.Title>
      <Dialog.Description>
        {hasCourses ? $t('onboarding.v2.welcome.body_samples') : $t('onboarding.v2.welcome.body_empty')}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={handleLater}>{$t('onboarding.v2.welcome.later')}</Button>
      <Button size="sm" onclick={handleTakeTour}>{$t('onboarding.v2.welcome.take_tour')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
