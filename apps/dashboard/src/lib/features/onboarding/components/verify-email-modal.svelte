<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { authClient } from '$lib/utils/services/auth/client';
  import { logout } from '$lib/utils/functions/logout';
  import { classroomio } from '$lib/utils/services/api';
  import { globalStore } from '$lib/utils/store/app';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { setupDOMProtection, updateBodyClass } from '../utils/dom-protection';
  import { LogOut } from '@lucide/svelte';

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

  const formattedCountdown = $derived.by(() => {
    const minutes = Math.floor(countDown / 60);
    const seconds = countDown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

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

    countDown = WAIT_SEC;

    interval = setInterval(() => {
      countDown = countDown - 1;
    }, 1000);

    setTimeout(() => {
      isSent = false;

      clearInterval(interval);
    }, WAIT_TIME);
  };

  const switchAccount = async () => {
    await logout();
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
  <Dialog.Content
    data-verification-modal
    class="w-4/5 max-w-[440px] gap-0 overflow-hidden p-0"
    showCloseButton={false}
    interactOutsideBehavior="ignore"
  >
    <div class="flex flex-col items-center px-8 pt-12 pb-10 text-center">
      <!-- <svg
        class="mb-8 h-8 w-8 text-gray-400 dark:text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="black"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 6-10 7L2 6" />
      </svg> -->

      <img src="/verify-email.svg" alt="email verification" />

      <h2 class="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
        {$t('verify_email_modal.heading')}
      </h2>

      <p class="max-w-[85%] text-sm text-gray-700 dark:text-gray-300">
        {$t('verify_email_modal.confirm_link_prefix')}
        <span class="font-bold text-gray-900 dark:text-gray-50">{$profile.email}</span>
        {$t('verify_email_modal.confirm_link_suffix')}
      </p>

      <div class="mt-10 flex flex-col items-center gap-3">
        {#if isSent}
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {$t('verify_email_modal.resend_in')}
            <span class="font-bold text-gray-900 dark:text-gray-50">{formattedCountdown}</span>
          </p>
        {:else}
          <Button disabled={loading} onclick={sendVerificationCode}>
            {#if loading}
              {$t('verify_email_modal.loading')}
            {:else}
              {$t('verify_email_modal.resend')}
            {/if}
          </Button>
        {/if}
      </div>
    </div>

    <div
      class="flex flex-row items-center gap-2 border-t border-gray-200 px-8 py-5 text-center text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
    >
      <p>
        {$t('verify_email_modal.wrong_address')}
      </p>
      <Button
        variant="link"
        class="ml-1 inline-flex items-center gap-1 font-bold text-gray-900 dark:text-gray-50"
        onclick={switchAccount}
      >
        <LogOut class="h-4 w-4" />
        {$t('verify_email_modal.switch_account')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
