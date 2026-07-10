<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { authClient } from '$lib/utils/services/auth/client';
  import { classroomio } from '$lib/utils/services/api';
  import { globalStore } from '$lib/utils/store/app';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { setupDOMProtection, updateBodyClass } from '../utils/dom-protection';

  const WAIT_SEC = 120; // 2 minutes
  const WAIT_TIME = WAIT_SEC * 1000;

  let loading = $state(false);
  let isSent = $state(false);
  let autoTriggered = $state(false);

  let interval;
  let countDown = $state(WAIT_SEC);

  const session = authClient.useSession();
  const sessionUser = $derived($session.data?.user ?? null);
  const isEmailVerified = $derived(Boolean($profile.isEmailVerified || sessionUser?.emailVerified));
  const open = $derived(Boolean(!isEmailVerified && !!$profile.id && !!$currentOrg.id));

  let domProtectionCleanup: ReturnType<typeof setupDOMProtection> | undefined;

  async function syncProfileFromAccount() {
    const response = await classroomio.account.$get();
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (data.success && data.profile) {
      profile.set(data.profile);
    }
  }

  function isAlreadyVerifiedError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as { code?: string; message?: string };
    return maybeError.code === 'EMAIL_IS_ALREADY_VERIFIED' || maybeError.message === 'Email is already verified';
  }

  const sendVerificationCode = async () => {
    if (!$profile.email) {
      snackbar.error('verify_email_modal.snackbar.error');
      return;
    }

    if (loading || isSent) return;

    loading = true;

    try {
      const callbackURL = new URL(page.url.href);
      callbackURL.searchParams.set('trigger', 'app');

      // Avoid showing welcome popup in lms
      if (!$globalStore.isOrgSite) {
        callbackURL.searchParams.set('welcomePopup', 'true');
      }

      const result = await authClient.sendVerificationEmail({
        email: $profile.email,
        callbackURL: callbackURL.toString()
      });

      if (result?.error && isAlreadyVerifiedError(result.error)) {
        await syncProfileFromAccount();
        return;
      }

      isSent = true;
    } catch (error) {
      if (isAlreadyVerifiedError(error)) {
        await syncProfileFromAccount();
        return;
      }

      snackbar.error('verify_email_modal.snackbar.error');
    } finally {
      loading = false;
    }

    if (!isSent) {
      return;
    }

    interval = setInterval(() => {
      countDown = countDown - 1;
    }, 1000);

    setTimeout(() => {
      isSent = false;

      clearInterval(interval);
    }, WAIT_TIME);
  };

  onMount(() => {
    if (browser && $profile.id) {
      domProtectionCleanup = setupDOMProtection(() => isEmailVerified);
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (domProtectionCleanup) {
      domProtectionCleanup.cleanup();
    }
  });

  $effect(() => {
    if (browser) updateBodyClass(isEmailVerified);

    if (browser && !isEmailVerified && $profile.id) {
      console.warn(
        '%c🔒 SECURITY WARNING: Email verification required',
        'color: red; font-weight: bold; font-size: 16px;',
        '\nAll user interactions are disabled until email verification is completed.',
        '\nAttempting to bypass this protection is monitored and logged.'
      );
    }
  });

  $effect(() => {
    if (!browser || !$profile.id || $profile.isEmailVerified || !sessionUser?.emailVerified) {
      return;
    }

    void syncProfileFromAccount();
  });

  $effect(() => {
    if (!open || isSent || loading || autoTriggered) return;

    // Only send verification code on load once
    autoTriggered = true;
    sendVerificationCode();
  });
</script>

<Dialog.Root {open}>
  <Dialog.Content class="w-4/5 max-w-[500px] p-4" showCloseButton={false} interactOutsideBehavior="ignore">
    <Dialog.Header>
      <Dialog.Title>{$t('verify_email_modal.heading')}</Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col items-center space-y-6 text-center">
      <img src="/verify-email.svg" alt="email verification" />
      <p class="text-xl">{$t('verify_email_modal.heading')}</p>
      <p class="w-[70%] text-sm text-gray-700 dark:text-gray-200">
        {$t('verify_email_modal.sent_verification')}
        {$profile.email}
        {$t('verify_email_modal.to_confirm')}
      </p>

      <div class="flex flex-col items-center">
        <Button disabled={loading || isSent} onclick={sendVerificationCode}>
          {#if loading}
            {$t('verify_email_modal.loading')}
          {:else}
            {$t('verify_email_modal.resend')}
          {/if}
        </Button>
        {#if isSent}
          <p class="text-xs text-gray-700">
            {$t('verify_email_modal.resend_in')}
            {countDown}
            {$t('verify_email_modal.seconds')}
          </p>
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
